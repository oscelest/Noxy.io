import _ from "lodash";
import React from "react";
import Entity from "../../classes/Entity";
import IconType from "../../enums/components/IconType";
import Global from "../../Global";
import ErrorText from "../Text/ErrorText";
import Button from "./Button";
import Style from "./EntityMultiSelect.module.scss";
import Input from "./Input";

export default class EntityMultiSelect<E extends Entity, K extends EntityStringPropertyKeys<E>> extends React.Component<EntityMultiSelectProps<E, K>, State<E, K>> {

  public context: Global.Context;
  public static contextType = Global?.Context ?? React.createContext({});

  constructor(props: EntityMultiSelectProps<E, K>) {
    super(props);

    this.state = {
      index:   -1,
      input:   "",
      loading: false,
      list:    [],
    };
  }

  private readonly getValue = (entity?: E) => {
    return (entity?.[this.props.property] ?? "") as string;
  };

  private readonly search = (input: string) => {
    this.setState({input, loading: true, error: undefined});
    return this.searchInternal(input);
  };

  private readonly searchInternal = _.debounce(
    async (search: string) => {
      try {
        const list = await this.props.method(search);
        this.setState({list, loading: false, index: _.findIndex(list, entity => this.getValue(entity) === search)});
      }
      catch (error) {
        const next_state = {list: [] as E[], loading: false, index: -1} as State<E, K>;

        this.props.onError ? this.props.onError(error) : (next_state.error = error);
        this.setState(next_state);
      }
    },
    500,
  );


  public render() {
    const {list, index, input, loading} = this.state;
    const {label} = this.props;

    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);

    return (
      <div className={classes.join(" ")}>
        {this.renderError()}

        <div className={Style.Search}>
          <Input className={Style.Input} label={label} loading={loading} value={input} index={index}
                 onChange={this.eventChange} onIndexChange={this.eventIndexChange} onIndexCommit={this.eventIndexCommit}>
            {_.map(list, (entity, key) => <span key={key} className={Style.Item}>{entity[this.props.property]}</span>)}
          </Input>
          {this.renderCreate()}
        </div>

        <div className={Style.List}>
          {_.map(this.props.children, (entity, index) => <Button key={index} className={Style.Button} value={entity} onClick={this.eventClick}>{entity[this.props.property]}</Button>)}
        </div>

      </div>
    );
  }

  private readonly renderError = () => {
    const error = this.props.error ?? this.state.error;
    if (!error) return;

    return (
      <ErrorText className={Style.Error}>{error.message}</ErrorText>
    );
  };

  private readonly renderCreate = () => {
    if (!this.props.onCreate) return null;

    return (
      <Button icon={IconType.ADD} value={this.state.input} disabled={this.state.input.length < 3} onClick={this.eventCreate}/>
    );
  };

  private readonly eventCreate = async (search: string) => {
    if (!this.props.onCreate) return;

    this.setState({input: "", index: -1, list: []});
    this.props.onChange([...this.props.children as E[], await this.props.onCreate(search)]);
  };
  private readonly eventClick = (value: E) => this.props.onChange(_.filter(this.props.children as E[], entity => entity.getPrimaryKey() !== value.getPrimaryKey()));

  private readonly eventChange = (input: string) => this.search(input);
  private readonly eventIndexChange = (index: number) => this.setState({index});
  private readonly eventIndexCommit = (index: number) => {
    this.setState({input: "", index: -1, list: []});
    this.props.onChange([...this.props.children as E[], this.state.list[index]]);
  };

}

type EntityStringPropertyKeys<E extends Entity> = { [key in keyof E]: E[key] extends string ? (E[key] extends Function ? never : key) : never }[keyof E]

export interface EntityMultiSelectProps<E extends Entity, K extends EntityStringPropertyKeys<E>> {
  label: string
  error?: Error

  method: (search: string) => E[] | Promise<E[]>
  property: K

  children?: E[]
  className?: string

  onError?(error: Error): void
  onCreate?(search: string): E | Promise<E>
  onChange(entity?: E[]): void
}

interface State<E extends Entity, K extends EntityStringPropertyKeys<E>> {
  error?: Error
  index: number
  input: string
  loading: boolean
  list: E[]
}
