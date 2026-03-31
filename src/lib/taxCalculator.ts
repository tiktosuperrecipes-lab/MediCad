export interface TaxCalculation {
  grossIncome: number;
  deductibleExpenses: number;
  baseCalc: number;
  taxAmount: number;
  effectiveRate: number;
}

// Tabela Progressiva Mensal do IRRF 2024/2025
export const calculateMonthlyIR = (grossIncome: number, deductibleExpenses: number = 0): TaxCalculation => {
  const baseCalc = Math.max(0, grossIncome - deductibleExpenses);
  let taxAmount = 0;

  if (baseCalc <= 2259.20) {
    taxAmount = 0;
  } else if (baseCalc <= 2826.65) {
    taxAmount = (baseCalc * 0.075) - 169.44;
  } else if (baseCalc <= 3751.05) {
    taxAmount = (baseCalc * 0.15) - 381.44;
  } else if (baseCalc <= 4664.68) {
    taxAmount = (baseCalc * 0.225) - 662.77;
  } else {
    taxAmount = (baseCalc * 0.275) - 896.00;
  }

  taxAmount = Math.max(0, taxAmount);

  return {
    grossIncome,
    deductibleExpenses,
    baseCalc,
    taxAmount,
    effectiveRate: grossIncome > 0 ? (taxAmount / grossIncome) * 100 : 0
  };
};
