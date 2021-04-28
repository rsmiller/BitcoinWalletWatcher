import { Component } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';

import {AddressStorage, BitcoinAddressInfo, ExchangeRate, EthereumExchange, Wallet, EthereumAddressInfo } from './../../models/Main';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  title = 'Bitcoin Wallet Watcher';

  private _HttpClient: HttpClient;

  public Storage: AddressStorage;
  public Failure: boolean = false;

  public BitcoinFinalBalance: number = 0;
  public EtherFinalBalance: number = 0;
  public NonDumbEtherFinalBalance: number = 0;

  public StartingMonetaryAmount: string = "$0";
  public MonetaryAmount: string = '$0';
  public Currency: string = 'USD';
  public CurrencySymbol: string = '$';
  public ExchangeRate: ExchangeRate;

  public EtherPrice: number = 0;
  public BitcoinPrice: number = 0;

  public Wallets: Array<Wallet> = new Array<Wallet>();

  private CurrencyTicker: any;

  public CurrencyAnimation: boolean = true;
  public CurrencyAnimationUp: boolean = false;
  public CurrencyAnimationDown: boolean = false;

  constructor(http: HttpClient) {
      this._HttpClient = http;
  }

  ngOnInit() {
    this.GetWallet();
  }

  public AddWallet()
  {
    let newWallet = new Wallet();
    newWallet.type = "Bitcoin";

    this.Wallets.push(newWallet);

    if (typeof(Storage) !== "undefined") 
    {
      var storageInfo = new AddressStorage();
      storageInfo.currency_symbol = this.CurrencySymbol;
      storageInfo.currency = this.Currency;
      storageInfo.wallets = this.Wallets;

      this.Storage = storageInfo;

      localStorage.setItem("btc_w_w", JSON.stringify(storageInfo));
    }

    this.allowSubmit = true;
  }

  public RemoveWallet(index: number)
  {
    console.log(index);
    let buffer = new Array<Wallet>();

    for(let i=0;i<this.Wallets.length; i++)
    {
      if(i != index)
      {
        buffer.push(this.Wallets[i]);
      }
    }

    this.Wallets = buffer;

    if (typeof(Storage) !== "undefined") 
    {
      var storageInfo = new AddressStorage();
      storageInfo.currency_symbol = this.CurrencySymbol;
      storageInfo.currency = this.Currency;
      storageInfo.wallets = this.Wallets;

      this.Storage = storageInfo;

      localStorage.setItem("btc_w_w", JSON.stringify(storageInfo));
    }

    this.BitcoinFinalBalance = 0;
    this.EtherFinalBalance = 0;
    this.NonDumbEtherFinalBalance = 0;

    for(let i=0; i< this.Wallets.length; i++)
    {
      this.GetWalletInfo(this.Wallets[i].address, this.Wallets[i].type);
    }
  }

  public GetAddressInfo()
  {
    if (typeof(Storage) !== "undefined") 
    {
      var storageInfo = new AddressStorage();
      storageInfo.currency_symbol = this.CurrencySymbol;
      storageInfo.currency = this.Currency;
      storageInfo.wallets = this.Wallets;

      this.Storage = storageInfo;

      localStorage.setItem("btc_w_w", JSON.stringify(storageInfo));
    }

    for(let i=0; i< this.Wallets.length; i++)
    {
      this.GetWalletInfo(this.Wallets[i].address, this.Wallets[i].type);
    }

    this.DoTicker();

    this.allowSubmit = false;
  }

  public GetWallet()
  {
    if (typeof(Storage) !== "undefined") {
      let walletData = localStorage.getItem("btc_w_w");
  
      if(walletData != null && walletData != "")
      {
        this.Storage = JSON.parse(walletData);
        this.Wallets =  this.Storage.wallets;
        this.Currency = this.Storage.currency;
        this.CurrencySymbol = this.Storage.currency_symbol;

        for(let i=0; i< this.Wallets.length; i++)
        {
          this.GetWalletInfo(this.Wallets[i].address, this.Wallets[i].type);
        }
        
        this.DoTicker();
      }
      else
      {
        // Add
        let storageInfo = new AddressStorage();
        storageInfo.wallets = new Array<Wallet>();
        storageInfo.currency = 'USD';
        storageInfo.currency_symbol = 'USD';
        this.Storage = storageInfo;
        
        localStorage.setItem("btc_w_w", JSON.stringify(storageInfo));
      }
    } else {
      // Sorry! No Web Storage support..
      console.log("No local storage support");
      this.Failure = true;
      alert("This application needs local storage to run!");
    }
  }
  
  public GetWeiFromExchange(wei: string)
  {
    let position = wei.indexOf("00", 1);
    return Number(wei.substring(0, position));
  }

  public ConvertWeiToNonDumbNumber(wei: string)
  {
    let weiNumber = Number(wei);
    let theWei = weiNumber/10e17;

    return theWei;
  }

  public GetWalletInfo(address: string, type: string)
  {
    if(address == "" || address == null)
    {
      return;
    }

    if(type == "Bitcoin" && address.substr(0, 2) != "0x")
    {
      this._HttpClient.get<BitcoinAddressInfo>('https://blockchain.info/rawaddr/' + address + '?limit=20').subscribe(result => {
        //console.trace(result);
        this.BitcoinFinalBalance = result.final_balance;

        this.GetCurrencyInfo();
      }, error => {
        console.error(error);
      })
    }

    if(type == "Ethereum" && address.substr(0, 2) == "0x")
    {      
      this._HttpClient.get<EthereumAddressInfo>('https://api.etherscan.io/api?module=account&action=balance&address=' + address + '&blocktype=blocks&apikey=S6GHNR83G57HYW6G2ICQ6E43K6MQ7NAY8A').subscribe(result => {
        
        this.NonDumbEtherFinalBalance = this.ConvertWeiToNonDumbNumber(result.result);

        let theWei = this.GetWeiFromExchange(result.result);
        this.EtherFinalBalance = 0;

        this.EtherFinalBalance = this.EtherFinalBalance + theWei;

        this.GetCurrencyInfo();
      }, error => {
        console.error(error);
      })
    }
  }

  public GetCurrencyInfo()
  {

    if(this.BitcoinFinalBalance > 0)
    {
      const api_headers = new HttpHeaders({
        'Response-Type': 'Text',
        'Access-Control-Allow-Origin': '*'
      });

      this._HttpClient.get('https://blockchain.info/frombtc?currency=' + this.Currency + '&cors=false&value=' + this.BitcoinFinalBalance, {responseType: 'text'}).subscribe(result => {

        let newAmount = this.CurrencySymbol + result;

        if(this.MonetaryAmount != newAmount)
        {
          this.CurrencyAnimation = true;
        }

        this.MonetaryAmount = newAmount;

        let bufferPrice = Number(result);

        if(this.BitcoinPrice != bufferPrice)
        {
          this.CurrencyAnimation = true;

          if(bufferPrice > this.BitcoinPrice)
          {
            this.CurrencyAnimationUp = true;
            this.CurrencyAnimationDown = false;
          }

          if(bufferPrice < this.BitcoinPrice)
          {
            this.CurrencyAnimationUp = false;
            this.CurrencyAnimationDown = true;
          }
        }

        this.BitcoinPrice = Number(bufferPrice.toFixed(2));

        //console.log(this.BitcoinPrice);

        this.MonetaryAmount = this.CurrencySymbol + Number(this.EtherPrice + this.BitcoinPrice).toFixed(2);
      }, error => {
          console.error(error);
      })
    }

    if(this.EtherFinalBalance > 0)
    {
      //console.trace(this.EtherFinalBalance);

      const api_headers = new HttpHeaders({
        'X-CMC_PRO_API_KEY': '0cf4b9f0-043d-4f08-8c7a-ed91119d08f3',
        'Access-Control-Allow-Origin': '*'
      });

      this._HttpClient.get<EthereumExchange>('https://api.coincap.io/v2/markets?baseSymbol=ETH&quoteSymbol=' + this.Currency).subscribe(result => {
        let price = 1;

        if(this.Currency == 'USD')
        {
          let exchange = result.data.filter(m=>m.exchangeId == 'gdax');

          if(exchange != null)
          {
            price = Number(exchange[0].priceQuote);
          }
          else
          {
            price = Number(result.data[0].priceQuote);
          }
        }
        else
        {
          price = Number(result.data[0].priceQuote);
        }


        
        let converted = Number(price.toFixed(2)) * this.NonDumbEtherFinalBalance;
        let bufferPrice = Number(converted.toFixed(2));
       
        if(this.EtherPrice != bufferPrice)
        {
          this.CurrencyAnimation = true;

          if(bufferPrice > this.EtherPrice)
          {
            this.CurrencyAnimationUp = true;
            this.CurrencyAnimationDown = false;
          }

          if(bufferPrice < this.EtherPrice)
          {
            this.CurrencyAnimationUp = false;
            this.CurrencyAnimationDown = true;
          }
        }


        this.EtherPrice = bufferPrice;
        //console.log(this.EtherPrice);

        this.MonetaryAmount = this.CurrencySymbol + Number(this.EtherPrice + this.BitcoinPrice).toFixed(2);
        
      }, error => {
          console.error(error);
      })
    }  
  }

  public selectedCurrency(x: any)
  {
    this.Currency = x.value;

    if(this.Currency == 'USD')
    {
      this.CurrencySymbol = "$";
    }

    if(this.Currency == 'AUD')
    {
      this.CurrencySymbol = this.ExchangeRate.AUD.symbol;
    }

    if(this.Currency == 'CAD')
    {
      this.CurrencySymbol = this.ExchangeRate.CAD.symbol;
    }

    if(this.Currency == 'EUR')
    {
      this.CurrencySymbol = this.ExchangeRate.EUR.symbol;
    }

    if(this.Currency == 'GBP')
    {
      this.CurrencySymbol = this.ExchangeRate.GBP.symbol;
    }

    if(this.Currency == 'JPY')
    {
      this.CurrencySymbol = this.ExchangeRate.JPY.symbol;
    }

    if(this.Currency == 'RUB')
    {
      this.CurrencySymbol = this.ExchangeRate.RUB.symbol;
    }

    this.CurrencyAnimation = false;
    this.GetCurrencyInfo();

    if (typeof(Storage) !== "undefined") {
      let walletData = localStorage.getItem("btc_w_w");
  
      if(walletData != null && walletData != "")
      {
        var storageInfo: AddressStorage = JSON.parse(walletData);
        storageInfo.currency_symbol = this.CurrencySymbol;
        storageInfo.currency = this.Currency;

        this.Storage = storageInfo;

        localStorage.setItem("btc_w_w", JSON.stringify(storageInfo));
      }
    }
  }

  private DoTicker()
  {
    if(this.CurrencyTicker == null)
    {
      var self = this;
      this.CurrencyTicker = setInterval(function()
      {
        self.CurrencyAnimation = false;
        self.CurrencyAnimationDown = false;
        self.CurrencyAnimationUp = false;

        if(self.StartingMonetaryAmount == "$0")
        {
          self.StartingMonetaryAmount = self.CurrencySymbol + Number(self.EtherPrice + self.BitcoinPrice).toFixed(2);
        }

        self.GetCurrencyInfo();

        self.allowSubmit = true;
      }, 20000);
    }
  }

  private allowSubmit: boolean = false;

  public validForm()
  {
    if(this.Wallets.length == 0)
    {
      return false;
    }

    return this.allowSubmit;
  }
}
