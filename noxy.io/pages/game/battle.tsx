import _ from "lodash";
import React from "react";
import Global from "../../Global";
import Style from "./battle.module.scss";
import {v4} from "uuid";

export default class IndexPage extends React.Component<{}, State> {
  
  public static contextType = Global?.Context ?? React.createContext({});
  public context: Global.Context;
  
  constructor(props: {}) {
    super(props);
    this.state = {
      party: [new Unit("Myra"), new Unit("Noxy"), new Unit("Maja"), new Unit("Laura")]
    };
  }
  
  public render() {
    return (
      <div className={Style.Component}>
        <div className={Style.Screen}>
          <div className={Style.TurnCounter}>
            <div className={Style.UnitTurn}>
            
            </div>
            <div className={Style.EffectTurn}>
            
            </div>
          </div>
          <div className={Style.Battlefield}>
          
          </div>
          <div className={Style.EnemyList}>
          
          </div>
        </div>
        <div className={Style.Party}>
          {_.map(this.state.party, this.renderPartyMember)}
        </div>
      </div>
    );
  }
  
  private readonly renderPartyMember = (unit: Unit, index: number) => {
    return (
      <div key={index} className={Style.PartyMember}>
        <div className={Style.Portrait}>
          <img src={"/static/portrait.png"}/>
        </div>
        <div className={Style.Info}>
          <div className={Style.Name}>
            <span>{unit.name}</span>
          </div>
          <div className={Style.Resources}>
            <div className={Style.HealthBar}>100/100</div>
            <div className={Style.PowerBar}>50/100</div>
          </div>
        </div>
      </div>
    )
  }
  
}

class Unit {
  
  public id: string
  public name: string
  
  constructor(name: string) {
    this.id = v4();
    this.name = name;
  }
  
}

interface State {
  party: Unit[]
}
