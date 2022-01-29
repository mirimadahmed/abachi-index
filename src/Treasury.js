import React from "react";
import { Div } from "atomize";
import Web3 from "web3";
import gohmAbi from './gohmAbi'

export default class Treasury extends React.Component {
  state = {
    index: 0,
  }
  componentDidMount() {
    let web3 = new Web3(`https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MATIC_KEY}`);

    // Get LP reserves for DAI and ABI
    const contract = new web3.eth.Contract(gohmAbi, "0x321019dC2dF5d09A47D3Cf4D8319E82feF9d75d4");

    contract.methods.index().call()
      .then((res) => {
        this.setState({
          index: res
        });
      });
  }

  render() {
    return (
      <Div>
        {this.state.index * Math.pow(10, -9)}
      </Div>
    );
  }
}
