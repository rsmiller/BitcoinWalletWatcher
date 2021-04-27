export class AddressStorage 
{
    wallets: Array<Wallet>;
    final_balance: number;
    currency: string;
    currency_symbol: string;
}

export class Wallet
{
    address: string;
    type: string = "Bitcoin";
}

export class BitcoinAddressInfo
{
    n_tx: number;
    final_balance: number;
}

export class ExchangeRate
{
    USD: RateInfo;
    AUD: RateInfo;
    CAD: RateInfo;
    EUR: RateInfo;
    GBP: RateInfo;
    JPY: RateInfo;
    RUB: RateInfo;
}

export class RateInfo
{
    last: number;
    symbol: string;
}

export class EthereumAddressInfo
{
    status: string;
    result: string;
}

export class EthereumExchange
{
    data: Array<EthereumExchangeData> = new Array<EthereumExchangeData>();
}

export class EthereumExchangeData{
    quoteSymbol: string;
    priceQuote: string;
    exchangeId: string;
}

