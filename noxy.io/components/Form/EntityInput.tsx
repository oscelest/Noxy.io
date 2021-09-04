import _ from "lodash";
import React from "react";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Component from "../Application/Component";
import Style from "./EntityInput.module.scss";
import Input from "./Input";

export default class EntityInput<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> extends Component<EntityInputProps<E, K>, State<E, K>> {
  
  constructor(props: EntityInputProps<E, K>) {
    super(props);
    
    this.state = {
      index:   -1,
      input:   "",
      loading: false,
      list:    [],
    };
  }
  
  private readonly getValue = (entity: E | undefined = this.props.value) => {
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
        const next_state = {error, list: [] as E[], loading: false, index: -1} as State<E, K>;
        
        if (this.props.value && this.getValue() === search) {
          next_state.index = 0;
          next_state.list.push(this.props.value);
        }
        
        this.setState(next_state);
        this.props.onError?.(error as Error);
      }
    },
    500,
  );
  
  public componentDidMount() {
    if (this.props.value) this.search(this.getValue());
  }
  
  public componentDidUpdate(prevProps: Readonly<EntityInputProps<E, K>>, prevState: Readonly<State<E, K>>) {
    const next_state = {} as State<E, K>;
    
    if (this.props.value?.getPrimaryID() !== prevProps.value?.getPrimaryID()) {
      if (this.props.value) {
        next_state.input = this.getValue();
        next_state.list = [this.props.value];
        next_state.index = 0;
      }
      else {
        next_state.input = "" as E[K] & string;
        next_state.list = [];
        next_state.index = -1;
      }
    }
    else if (this.props.value?.[this.props.property] && this.props.value?.[this.props.property] !== prevProps.value?.[this.props.property]) {
      next_state.input = this.getValue();
    }
    
    if (_.size(next_state)) this.setState(next_state);
  }
  
  public render() {
    const {list, index, input, loading} = this.state;
    const {label} = this.props;
    
    const error = this.props.error ?? this.state.error;
    const classes = [Style.Component];
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <Input className={classes.join(" ")} label={label} error={error} loading={loading} value={input} index={index}
             onReset={this.eventReset} onChange={this.eventChange} onIndexChange={this.eventIndexChange} onIndexCommit={this.eventIndexCommit}>
        {_.map(list, (entity, key) => <span key={key} className={Style.Item}>{entity[this.props.property]}</span>)}
      </Input>
    );
  }
  
  private readonly eventChange = (input: string) => {
    this.search(input as E[K] & string);
  };
  
  private readonly eventIndexChange = (index: number) => {
    this.setState({index});
  };
  
  private readonly eventIndexCommit = (index: number) => {
    this.props.onChange(this.state.list[index]);
  };
  
  private readonly eventReset = () => {
    if (!this.state.input) this.props.onChange(undefined);
    if (this.props.reset !== false) this.search(this.getValue());
  };
  
}

type EntityStringPropertyKeys<E extends BaseEntity> = { [key in keyof E]: E[key] extends string ? (E[key] extends Function ? never : key) : never }[keyof E]

export interface EntityInputProps<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> {
  label: string;
  error?: Error;
  value?: E;
  reset?: boolean;
  method: (search: string) => E[] | Promise<E[]>;
  property: K;
  
  className?: string;
  
  onError?(error: Error): void;
  onChange(entity?: E): void;
}

interface State<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> {
  error?: Error;
  index: number;
  input: string;
  loading: boolean;
  list: E[];
}
