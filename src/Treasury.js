import React from "react";
import axios from 'axios';
import { Container, Row, Col } from "react-bootstrap";
import Web3 from "web3";
import abis from './tokenabi'
import imusdAbi from './imusdabi'
import gohmAbi from './gohmAbi'

export default class Treasury extends React.Component {
  state = {
    total: 0,
    gohm: 0,
    index: 0,
    abi: 0,
    abiPrice: 0,
    ohmPrice: 0,
    mtaPrice: 0,
    stable: 0,
    mta: 0,
    lp: 0,
    core: 0,
    formatter: new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })
  }

  getPrice = (coin) => {
    return axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD&ids=${coin}&order=market_cap_desc&per_page=1&page=1&sparkline=false`)
  }

  getBalances() {
    const abi = "0x6d5f5317308c6fe7d6ce16930353a8dfd92ba4d7"
    const dai = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
    const maticAccount = process.env.REACT_APP_MATIC_ADDRESS
    // Get Matic Balance
    const params = {
      "jsonrpc": "2.0",
      "method": "alchemy_getTokenBalances",
      "params": [maticAccount, [abi, dai]],
      "id": 42
    }
    axios.post(`https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MATIC_KEY}`, params)
      .then(res => {
        const tokenBalanceMap = res.data.result.tokenBalances;
        tokenBalanceMap.forEach(element => {
          if (element.contractAddress === abi) {
            this.setState({ abi: Web3.utils.fromWei(Web3.utils.hexToNumberString(element.tokenBalance), 'Gwei') })
          }
          else if (element.contractAddress === dai) {
            let balance = this.state.stable + parseFloat(Web3.utils.fromWei(Web3.utils.hexToNumberString(element.tokenBalance)))
            this.setState({ stable: balance })
            
          }
        });
      })

    // Get Eth Balance
    const ethAccount = process.env.REACT_APP_ETH_ADDRESS
    const usdt = "0xdac17f958d2ee523a2206206994597c13d831ec7"
    const usdc = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    const mta = "0xa3BeD4E1c75D00fa6f4E5E6922DB7261B5E9AcD2"
    const paramsEth = {
      "jsonrpc": "2.0",
      "method": "alchemy_getTokenBalances",
      "params": [ethAccount, [usdt, usdc, mta]],
      "id": 42
    }
    axios.post(`https://eth-mainnet.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_ETH_KEY}`, paramsEth)
      .then(res => {
        const tokenBalanceMap = res.data.result.tokenBalances;
        tokenBalanceMap.forEach(element => {
          if (element.contractAddress === mta) {
            let balance = Web3.utils.fromWei(Web3.utils.hexToNumberString(element.tokenBalance));
            balance = parseFloat(balance);
            this.setState({ mta: balance })
          }
          else if ([usdt, usdc].includes(element.contractAddress)) {
            let balance = this.state.stable + Web3.utils.hexToNumberString(element.tokenBalance) * Math.pow(10, -6)
            this.setState({ stable: balance })
          }
        });
      })
  }

  componentDidMount() {
    this.getPrice('abachi').then((res) => {
      this.setState({
        abiPrice: res.data[0].current_price
      })
    })
    this.getPrice('meta').then((res) => {
      this.setState({
        mtaPrice: res.data[0].current_price
      })
    })
    this.getPrice('olympus').then((res) => {
      this.setState({
        ohmPrice: res.data[0].current_price
      })
    })
    this.getBalances();
    
    let web3 = new Web3(`https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MATIC_KEY}`);
    
    // Get LP reserves for DAI and ABI
    const lpContract = new web3.eth.Contract(abis, "0x81fd1d6d336c3a8a0596badc664ee01269551130");

    lpContract.methods.getReserves().call()
      .then((res) => {
        const abiReserve = parseFloat(Web3.utils.fromWei(res[0], 'Gwei'))
        const daiReserve = parseFloat(Web3.utils.fromWei(res[1]))

        this.setState({
          lp: daiReserve + (abiReserve * this.state.abiPrice)
        });
      });


    // Get mUSD balance - TODO
    const imUsdContract = new web3.eth.Contract(imusdAbi, "0x5290ad3d83476ca6a2b178cd9727ee1ef72432af")
    imUsdContract.methods.balanceOfUnderlying("0x4f33Ff9A7910d04c7FC77563090ae106899988Aa").call()
    .then((res) => {
    });

    // Get ohm balance
    web3.eth.Contract.setProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.REACT_APP_ALCHEMY_ETH_KEY}`)
    const ohmContract = new web3.eth.Contract(gohmAbi, "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f")
    ohmContract.methods.balanceOf(process.env.REACT_APP_ETH_ADDRESS).call()
    .then((res) => {
      this.setState({
        gohm: parseFloat(Web3.utils.fromWei(res))
      })
    });
    ohmContract.methods.index().call()
    .then((res) => {
      this.setState({
        index: parseFloat(Web3.utils.fromWei(res, 'GWei'))
      })
    })
  }

  render() {
    return (
      <Container fluid style={{
        padding: '50px'
      }}>
        <Row>
          <Col>
            <Row>
              <Col className="Element shadow">
                <h6>Total Treasury</h6>
                <p>
                  ${
                  this.state.formatter.format(
                    (this.state.stable + this.state.lp + 
                      (this.state.abi * this.state.abiPrice) +
                      (this.state.mta * this.state.mtaPrice) +
                      (this.state.gohm * this.state.index * this.state.ohmPrice)
                    )
                  )}
                </p>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row>
          <Col className="Element shadow">
            <h6>OHM</h6>
            <p>{this.state.formatter.format(this.state.gohm * this.state.index)}</p>
            <p>${this.state.formatter.format(this.state.gohm * this.state.index * this.state.ohmPrice)}</p>
          </Col>
          <Col className="Element shadow">
            <h6>MTA</h6>
            <p>{this.state.formatter.format(this.state.mta)}</p>
            <p>${this.state.formatter.format(this.state.mta * this.state.mtaPrice)}</p>
          </Col>
          <Col className="Element shadow">
            <h6>Stable</h6>
            <p>${this.state.formatter.format(this.state.stable)}</p>
          </Col>
          <Col className="Element shadow">
            <h6>LP</h6>
            <p>${this.state.formatter.format(this.state.lp)}</p>
          </Col>
          <Col className="Element shadow">
            <h6>ABI</h6>
            <p>{this.state.abi}</p>
            <p>${this.state.formatter.format(this.state.abiPrice * this.state.abi)}</p>
          </Col>
          <Col className="Element shadow">
            <h6>Core Fund</h6>
            <p>{this.state.formatter.format(this.state.core)}</p>
          </Col>
        </Row>
      </Container>
    );
  }
}
