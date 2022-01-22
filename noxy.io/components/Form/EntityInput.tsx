import _ from "lodash";
import React from "react";
import BaseEntity from "../../../common/classes/Entity/BaseEntity";
import Component from "../Application/Component";
import AutoComplete from "./AutoComplete";
import Style from "./EntityInput.module.scss";

export default class EntityInput<E extends BaseEntity> extends Component<EntityInputProps<E>, State<E>> {

  constructor(props: EntityInputProps<E>) {
    super(props);

    this.state = {
      list:    [],
      index:   -1,
      value:   "",
      loading: false,
    };
  }

  private getEntityValue(entity?: E) {
    return `${entity?.[this.props.property] ?? ""}`;
  }

  private getEntityIndex(value?: string, list = this.state.list) {
    if (value === undefined) return -1;
    return list.findIndex(entity => this.getEntityValue(entity).toLowerCase() === value.toLowerCase());
  }

  private readonly searchInternal = _.debounce(
    async (value: string) => {
      const list = await this.props.method(value);
      this.setState({list, value, index: this.getEntityIndex(value, list), loading: false});
    },
    500,
  );

  public componentDidMount() {
    if (this.props.value) {
      this.setState({value: this.getEntityValue(this.props.value), index: 0, list: [this.props.value], loading: true});
    }
  }

  public componentDidUpdate(prevProps: Readonly<EntityInputProps<E>>, prevState: Readonly<State<E>>, snapshot?: any): void {
    if (this.props.value && this.props.value?.getPrimaryID() !== prevProps.value?.getPrimaryID()) {
      this.setState({value: this.getEntityValue(this.props.value), index: 0, list: [this.props.value], loading: true});
    }
    else if (this.state.loading) {
      this.searchInternal(this.state.value);
    }
  }

  public render() {
    const {loading, value, index, list} = this.state;
    const {label, error, className} = this.props;

    const placeholder = !list.length && "No results...";

    const classes = [Style.Component];
    if (className) classes.push(className);

    return (
      <AutoComplete className={classes.join(" ")} label={label} value={value} index={index} error={error} loading={loading} placeholder={placeholder} strict={true}
                    onChange={this.eventInputChange} onInputChange={this.eventInputPreview} onIndexChange={this.eventIndexPreview} onReset={this.eventReset}>
        {list.map(entity => this.getEntityValue(entity))}
      </AutoComplete>
    );
  }

  private readonly eventInputChange = (value: string, index: number) => {
    this.props.onChange(this.state.list[index]);
    this.setState({value: this.getEntityValue(this.state.list[index]), index});
  };

  private readonly eventInputPreview = (value: string) => {
    this.setState({value, index: this.getEntityIndex(value), loading: true});
  };

  private readonly eventIndexPreview = (index: number) => {
    this.setState({index});
  };

  private readonly eventReset = () => {
    this.setState({value: this.getEntityValue(this.props.value), loading: true});
  };

}

type EntityStringPropertyKeys<E extends BaseEntity> = keyof { [K in keyof Pick<E, { [K in keyof E]: E[K] extends string ? K : never }[keyof E]>]: E[K] }

export interface EntityInputProps<E extends BaseEntity> {
  label: string;
  method: (search: string) => E[] | Promise<E[]>;
  property: EntityStringPropertyKeys<E>;

  value?: E;
  error?: Error;
  className?: string;

  onChange(entity?: E): void;
}

interface State<E> {
  list: E[];
  index: number;
  value: string;
  loading: boolean;
}
