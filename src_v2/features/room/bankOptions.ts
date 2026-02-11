export type BankOption = {
  code: string;
  name: string;
  shortName: string;
  onlineBankingUrl?: string;
};

export const BANK_OPTIONS: BankOption[] = [
  {
    code: "0001",
    name: "みずほ銀行",
    shortName: "みずほ",
    onlineBankingUrl: "https://www.mizuhobank.co.jp/direct/",
  },
  {
    code: "0005",
    name: "三菱UFJ銀行",
    shortName: "MUFG",
    onlineBankingUrl: "https://direct.bk.mufg.jp/",
  },
  {
    code: "0009",
    name: "三井住友銀行",
    shortName: "SMBC",
    onlineBankingUrl: "https://direct.smbc.co.jp/",
  },
  {
    code: "0010",
    name: "りそな銀行",
    shortName: "りそな",
    onlineBankingUrl: "https://www.resonabank.co.jp/kojin/net/",
  },
  {
    code: "0033",
    name: "ゆうちょ銀行",
    shortName: "ゆうちょ",
    onlineBankingUrl: "https://direct.jp-bank.japanpost.jp/",
  },
  {
    code: "0038",
    name: "住信SBIネット銀行",
    shortName: "住信SBI",
    onlineBankingUrl: "https://www.netbk.co.jp/",
  },
  {
    code: "0036",
    name: "楽天銀行",
    shortName: "楽天",
    onlineBankingUrl: "https://www.rakuten-bank.co.jp/",
  },
  {
    code: "0034",
    name: "PayPay銀行",
    shortName: "PayPay",
    onlineBankingUrl: "https://www.paypay-bank.co.jp/",
  },
  {
    code: "0039",
    name: "auじぶん銀行",
    shortName: "auじぶん",
    onlineBankingUrl: "https://www.jibunbank.co.jp/",
  },
  {
    code: "0310",
    name: "GMOあおぞらネット銀行",
    shortName: "GMOあおぞら",
    onlineBankingUrl: "https://gmo-aozora.com/",
  },
  {
    code: "0042",
    name: "ソニー銀行",
    shortName: "ソニー",
    onlineBankingUrl: "https://moneykit.net/",
  },
  {
    code: "0040",
    name: "イオン銀行",
    shortName: "イオン",
    onlineBankingUrl: "https://www.aeonbank.co.jp/",
  },
];

export function findBankOptionByCode(code?: string): BankOption | undefined {
  if (!code) return undefined;
  return BANK_OPTIONS.find((bank) => bank.code === code);
}

export function filterBankOptions(query: string): BankOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return BANK_OPTIONS;
  }
  return BANK_OPTIONS.filter((bank) =>
    [bank.name, bank.shortName, bank.code]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}

