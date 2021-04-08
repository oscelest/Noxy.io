import Crypto from "crypto";
import IsEmail from "isemail";
import _ from "lodash";
import EndpointParameterType from "../enums/EndpointParameterType";
import EndpointParameterException from "../exceptions/EndpointParameterException";
import Order from "../enums/Order";

namespace Validator {
  
  export function parseParameter(type: EndpointParameterType, value: string | string[], conditions: any = {}): any {
    if (Array.isArray(value)) {
      switch (type) {
        case EndpointParameterType.ORDER:
          return validateSortOrderList(value, conditions);
        default:
          return parseParameterList(type, value, conditions);
      }
    }
    
    switch (type) {
      case EndpointParameterType.BOOLEAN:
        return parseBoolean(value);
      case EndpointParameterType.EMAIL:
        return validateEmail(value);
      case EndpointParameterType.PASSWORD:
        return validatePassword(value);
      case EndpointParameterType.UUID:
        return validateUUID(value);
      
      case EndpointParameterType.DATE:
        return parseDate(value, conditions);
      case EndpointParameterType.ENUM:
        return validateEnum(value, conditions);
      case EndpointParameterType.FLOAT:
        return parseFloat(value, conditions);
      case EndpointParameterType.INTEGER:
        return parseInteger(value, conditions);
      case EndpointParameterType.ORDER:
        return validateOrdering(value, conditions);
      case EndpointParameterType.STRING:
        return validateString(value, conditions);
    }
  }
  
  function parseBoolean(received: string) {
    const parsed = received.toString().toLowerCase();
    const positive = ["true", "1", "+", "y", "yes"];
    const negative = ["false", "0", "-", "n", "no"];
    if (!positive.includes(parsed) && !negative.includes(parsed)) throw new EndpointParameterException("Boolean could not be parsed.", received, parsed);
    return positive.includes(parsed);
  }
  
  function validateEmail(received: string) {
    if (received.length > 128) throw new EndpointParameterException("Email is longer than allowed length.", received);
    if (!IsEmail.validate(received)) throw new EndpointParameterException("Email address could not be validated.", received);
    return received;
  }
  
  function validatePassword(received: string) {
    if (received.length > 1024) throw new EndpointParameterException("Password cannot be longer than 1024 characters.", received);
    if (received.length < 12) throw new EndpointParameterException(`Password must contain at least 12 characters.`, received);
    const salt = Crypto.randomBytes(64);
    const hash = Crypto.pbkdf2Sync(received, salt, 10000, 255, "sha512");
    return {salt, hash};
  }
  
  function validateUUID(received: string) {
    if (!received.match(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i)) throw new EndpointParameterException("UUID could not be validated.", received);
    return received;
  }

  function parseDate(received: string, {earliest, latest, timestamp}: DateParameterConditions) {
    const parsed = new Date(isNaN(+received) ? received : +received);
    if (isNaN(parsed.getTime())) throw new EndpointParameterException("Date could not be parsed.", received, parsed);
    if (earliest && parsed < earliest) throw new EndpointParameterException(`Date must be after ${earliest}.`, received, parsed);
    if (latest && parsed > latest) throw new EndpointParameterException(`Date must be before ${latest}.`, received, parsed);
    return parsed;
  }

  function validateEnum(received: string, options: EnumParameterConditions) {
    const values = _.values(options);
    if (!_.includes(values, received)) throw new EndpointParameterException(`Enum could not be validated. Valid enum values: ['${_.join(values, "', '")}'].`, received);
    return received;
  }
  
  function parseFloat(received: string, {min = -Infinity, max = Infinity, min_decimals = -Infinity, max_decimals = Infinity}: FloatParameterConditions) {
    const parsed = Number.parseFloat(received);
    if (isNaN(parsed)) throw new EndpointParameterException("Float could not be parsed.", received, parsed);
    if (!isFinite(parsed)) throw new EndpointParameterException("Float must be a finite number.", received, parsed);
    if (parsed < min) throw new EndpointParameterException(`Float must be greater than or equal to ${min}.`, received, parsed);
    if (parsed > max) throw new EndpointParameterException(`Float must be less than or equal to ${max}.`, received, parsed);
    
    const decimals = (parsed.toString().split(".")[1] || []).length;
    if (decimals < min_decimals) throw new EndpointParameterException(`Float cannot have less than ${min_decimals} decimals.`, received, parsed);
    if (decimals > max_decimals) throw new EndpointParameterException(`Float cannot have more than ${max_decimals} decimals.`, received, parsed);
    
    return parsed;
  }
  
  function parseInteger(received: string, {min = -Infinity, max = Infinity}: IntegerParameterConditions) {
    const parsed = Number.parseInt(received);
    if (isNaN(parsed) || parsed !== Number.parseFloat(received)) throw new EndpointParameterException("Integer could not be parsed.", received, parsed);
    if (!isFinite(parsed)) throw new EndpointParameterException("Integer must be a finite number.", received, parsed);
    if (parsed < min) throw new EndpointParameterException(`Integer must be greater than or equal to ${min}.`, received, parsed);
    if (parsed > max) throw new EndpointParameterException(`Integer must be less than or equal to ${max}.`, received, parsed);
    if (Math.floor(parsed) < parsed) throw new EndpointParameterException("Value is not an integer.", received, parsed);
    
    return parsed;
  }
  
  function validateOrdering(received: string, columns: OrderParameterConditions) {
    const parsed = received[0] === "-" ? {[received.substr(1)]: Order.DESC} : {[received]: Order.ASC};
    if (_.difference(_.keys(parsed), columns).length) throw new EndpointParameterException(`Sort order contains an invalid column. Accepted column(s): ${_.join(columns, ", ")}.`, received, parsed);
    
    return parsed;
  }
  
  function validateSortOrderList(received: string[], columns: OrderParameterConditions) {
    const parsed = _.reduce(received, (result, value) => value[0] === "-" ? _.set(result, value.substring(1), Order.DESC) : _.set(result, value, Order.ASC), {});
    if (_.difference(_.keys(parsed), columns).length) throw new EndpointParameterException(`Sort order contains invalid column(s). Accepted column(s): ${_.join(columns, ", ")}.`, received, parsed);
    
    return parsed;
  }
  
  function validateString(received: string, {min_length = -Infinity, max_length = Infinity, validator}: StringParameterConditions) {
    if (received.length < min_length) throw new EndpointParameterException(`String length must be greater than or equal to ${min_length} characters.`, received);
    if (received.length > max_length) throw new EndpointParameterException(`String length must be less or equal to ${max_length} characters.`, received);
    if (validator && !received.match(validator)) throw new EndpointParameterException(`String does not match the validator: '${validator}'.`, received);
    
    return received;
  }

  function parseParameterList(type: EndpointParameterType, received: string[], conditions: any) {
    const error_list = [] as EndpointParameterException[];
    const parsed_list = [] as boolean[];
    for (let i = 0; i < received.length; i++) {
      try {
        parsed_list.push(parseParameter(type, received[i], conditions));
      }
      catch (error) {
        error_list.push(error);
      }
    }
    return parsed_list;
  }

  export type ParameterConditions =
    DateParameterConditions
    | EnumParameterConditions
    | FloatParameterConditions
    | IntegerParameterConditions
    | OrderParameterConditions
    | StringParameterConditions
    | {}

  export type DateParameterConditions = {earliest?: Date; latest?: Date; timestamp?: boolean}
  export type EnumParameterConditions = {[key: string]: string | number}
  export type FloatParameterConditions = {min?: number; max?: number; min_decimals?: number; max_decimals?: number}
  export type IntegerParameterConditions = {min?: number; max?: number}
  export type OrderParameterConditions = string[]
  export type StringParameterConditions = {min_length?: number; max_length?: number; validator?: RegExp}
  
}

export default Validator;
