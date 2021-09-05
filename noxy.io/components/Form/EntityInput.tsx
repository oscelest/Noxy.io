import _ from "lodash";
import React from "react";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Util from "../../../common/services/Util";
import Component from "../Application/Component";
import AutoComplete from "./AutoComplete";
import Style from "./EntityInput.module.scss";

export default class EntityInput<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> extends Component<EntityInputProps<E, K>, State<E, K>> {
  
  constructor(props: EntityInputProps<E, K>) {
    super(props);
    
    this.state = {
      loading: false,
      list:    [],
    };
  }
  
  public readonly search = (value?: string) => {
    this.setState({value, index: undefined, loading: true});
    return this.searchInternal(value);
  };
  
  private readonly searchInternal = _.debounce(
    async (value?: string) => {
      const list = await this.props.method(value ?? "");
      if (this.props.value && !list.some(entity => entity.getPrimaryID() === this.props.value?.getPrimaryID())) list.unshift(this.props.value);
      
      const index = value ? list.findIndex(entity => this.getValue(entity) === value) : undefined;
      this.setState({list, index, value: this.state.value ?? this.getValue(this.props.value), loading: false});
    },
    500,
  );
  
  private readonly getValue = (entity?: E) => {
    return entity ? `${entity[this.props.property]}` : "";
  };

  public componentDidMount() {
    if (this.props.value) {
      this.search();
    }
  }
  
  public componentDidUpdate(prevProps: Readonly<EntityInputProps<E, K>>, prevState: Readonly<State<E, K>>) {
    const next_state = {} as State<E, K>;
    
    if (this.props.value && this.props.value?.getPrimaryID() !== prevProps.value?.getPrimaryID()) {
      this.search();
    }

    if (Util.size(next_state)) this.setState(next_state);
  }
  
  public render() {
    const {loading} = this.state;
    const {label, error} = this.props;

    const index = this.state.index ?? -1;
    const value = this.state.value ?? this.getValue(this.props.value);
    const list = this.state.list.map(entity => this.getValue(entity));
    const classes = [Style.Component];
    const placeholder = !this.state.list.length && "No results...";
    if (this.props.className) classes.push(this.props.className);
    
    return (
      <AutoComplete className={classes.join(" ")} label={label} value={value} index={index} error={error} loading={loading} placeholder={placeholder}
                    onChange={this.eventChange} onInputChange={this.eventInputChange} onReset={this.eventReset}>
        {list}
      </AutoComplete>
    );
  }
  
  private readonly eventChange = (index: number) => {
    this.search();
    this.props.onChange(this.state.list[index]);
  };
  
  private readonly eventInputChange = (value: string) => {
    this.search(value)
  };

  private readonly eventReset = () => {
    this.search();
  };
  
}

type EntityStringPropertyKeys<E extends BaseEntity> = { [key in keyof E]: E[key] extends string ? (E[key] extends Function ? never : key) : never }[keyof E]

export interface EntityInputProps<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> {
  label: string;
  method: (search: string) => E[] | Promise<E[]>;
  property: K;
  
  value?: E;
  error?: Error;
  className?: string;
  
  onChange(entity?: E): void;
}

interface State<E extends BaseEntity, K extends EntityStringPropertyKeys<E>> {
  index?: number;
  value?: string;
  loading: boolean;
  list: E[];
}
