import Crypto from "crypto";
import IsEmail from "isemail";
import _ from "lodash";
import ValidatorType from "../enums/ValidatorType";
import ValidatorException from "../exceptions/ValidatorException";
import Order from "../enums/Order";

namespace Validator {
  
  export function parseParameter(type: ValidatorType, value: string | string[], conditions: any = {}) {
    if (Array.isArray(value)) {
      switch (type) {
        case ValidatorType.ORDER:
          return validateSortOrderList(value, conditions);
        default:
          return parseParameterList(type, value, conditions);
      }
    }
    
    switch (type) {
      case ValidatorType.BOOLEAN:
        return parseBoolean(value);
      case ValidatorType.EMAIL:
        return validateEmail(value);
      case ValidatorType.PASSWORD:
        return validatePassword(value);
      case ValidatorType.UUID:
        return validateUUID(value);
      
      case ValidatorType.DATE:
        return parseDate(value, conditions);
      case ValidatorType.ENUM:
        return validateEnum(value, conditions);
      case ValidatorType.FLOAT:
        return parseFloat(value, conditions);
      case ValidatorType.INTEGER:
        return parseInteger(value, conditions);
      case ValidatorType.ORDER:
        return validateOrdering(value, conditions);
      case ValidatorType.STRING:
        return validateString(value, conditions);
    }
  }
  
  function parseBoolean(received: string) {
    const parsed = received.toString().toLowerCase();
    const positive = ["true", "1", "+", "y", "yes"];
    const negative = ["false", "0", "-", "n", "no"];
    if (!positive.includes(parsed) && !negative.includes(parsed)) throw new ValidatorException("Boolean could not be parsed.", received, parsed);
    return positive.includes(parsed);
  }
  
  function validateEmail(received: string) {
    if (received.length > 128) throw new ValidatorException("Email is longer than allowed length.", received);
    if (!IsEmail.validate(received)) throw new ValidatorException("Email address could not be validated.", received);
    return received;
  }
  
  function validatePassword(received: string) {
    if (received.length > 1024) throw new ValidatorException("Password cannot be longer than 1024 characters.", received);
    if (received.length < 12) throw new ValidatorException(`Password must contain at least 12 characters.`, received);
    const salt = Crypto.randomBytes(64);
    const hash = Crypto.pbkdf2Sync(received, salt, 10000, 255, "sha512");
    return {salt, hash};
  }
  
  function validateUUID(received: string) {
    if (!received.match(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i)) throw new ValidatorException("UUID could not be validated.", received);
    return received;
  }

  function parseDate(received: string, {earliest, latest, timestamp}: DateParameterConditions) {
    const parsed = new Date(isNaN(+received) ? received : +received);
    if (isNaN(parsed.getTime())) throw new ValidatorException("Date could not be parsed.", received, parsed);
    if (earliest && parsed < earliest) throw new ValidatorException(`Date must be after ${earliest}.`, received, parsed);
    if (latest && parsed > latest) throw new ValidatorException(`Date must be before ${latest}.`, received, parsed);
    return parsed;
  }

  function validateEnum(received: string, options: EnumParameterConditions) {
    const values = _.values(options);
    if (!_.includes(values, received)) throw new ValidatorException(`Enum could not be validated. Valid enum values: ['${_.join(values, "', '")}'].`, received);
    return received;
  }
  
  function parseFloat(received: string, {min = -Infinity, max = Infinity, min_decimals = -Infinity, max_decimals = Infinity}: FloatParameterConditions) {
    const parsed = Number.parseFloat(received);
    if (isNaN(parsed)) throw new ValidatorException("Float could not be parsed.", received, parsed);
    if (!isFinite(parsed)) throw new ValidatorException("Float must be a finite number.", received, parsed);
    if (parsed < min) throw new ValidatorException(`Float must be greater than or equal to ${min}.`, received, parsed);
    if (parsed > max) throw new ValidatorException(`Float must be less than or equal to ${max}.`, received, parsed);
    
    const decimals = (parsed.toString().split(".")[1] || []).length;
    if (decimals < min_decimals) throw new ValidatorException(`Float cannot have less than ${min_decimals} decimals.`, received, parsed);
    if (decimals > max_decimals) throw new ValidatorException(`Float cannot have more than ${max_decimals} decimals.`, received, parsed);
    
    return parsed;
  }
  
  function parseInteger(received: string, {min = -Infinity, max = Infinity}: IntegerParameterConditions) {
    const parsed = Number.parseInt(received);
    if (isNaN(parsed) || parsed !== Number.parseFloat(received)) throw new ValidatorException("Integer could not be parsed.", received, parsed);
    if (!isFinite(parsed)) throw new ValidatorException("Integer must be a finite number.", received, parsed);
    if (parsed < min) throw new ValidatorException(`Integer must be greater than or equal to ${min}.`, received, parsed);
    if (parsed > max) throw new ValidatorException(`Integer must be less than or equal to ${max}.`, received, parsed);
    if (Math.floor(parsed) < parsed) throw new ValidatorException("Value is not an integer.", received, parsed);
    
    return parsed;
  }
  
  function validateOrdering(received: string, columns: OrderParameterConditions) {
    const parsed = received[0] === "-" ? {[received.substr(1)]: Order.DESC} : {[received]: Order.ASC};
    if (_.difference(_.keys(parsed), columns).length) throw new ValidatorException(`Sort order contains an invalid column. Accepted column(s): ${_.join(columns, ", ")}.`, received, parsed);
    
    return parsed;
  }
  
  function validateSortOrderList(received: string[], columns: OrderParameterConditions) {
    const parsed = _.reduce(received, (result, value) => value[0] === "-" ? _.set(result, value.substring(1), Order.DESC) : _.set(result, value, Order.ASC), {});
    if (_.difference(_.keys(parsed), columns).length) throw new ValidatorException(`Sort order contains invalid column(s). Accepted column(s): ${_.join(columns, ", ")}.`, received, parsed);
    
    return parsed;
  }
  
  function validateString(received: string, {min_length = -Infinity, max_length = Infinity, validator}: StringParameterConditions) {
    if (received.length < min_length) throw new ValidatorException(`String length must be greater than or equal to ${min_length} characters.`, received);
    if (received.length > max_length) throw new ValidatorException(`String length must be less or equal to ${max_length} characters.`, received);
    if (validator && !received.match(validator)) throw new ValidatorException(`String does not match the validator: '${validator}'.`, received);
    
    return received;
  }

  function parseParameterList(type: ValidatorType, received: string[], conditions: any) {
    const error_list = [] as ValidatorException[];
    const parsed_list = [] as any[];
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
