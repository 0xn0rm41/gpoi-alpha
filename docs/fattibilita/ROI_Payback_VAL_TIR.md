# Profitability indicators: ROI, payback, NPV (VAL), IRR (TIR), break-even

Purpose: judge whether an investment (for example: moving Hub Studenti to its own host and offering hosted SaaS) earns more than it costs, and how fast. **All numbers in the worked example are hypothetical inputs, not forecasts, and not market data.** Computed with the Python script at the end so the results can be reproduced.

## 1. Terminology (English / Italian)

| English | Italian | Notes |
|---|---|---|
| Return on Investment (ROI) | Ritorno sull'investimento (ROI) | Ratio, no time value of money |
| Payback period | Periodo di recupero / tempo di ritorno (PBP) | Time to recover the investment |
| Discounted payback | Payback attualizzato | Same, with discounted flows |
| Net Present Value (NPV) | Valore Attuale Netto (**VAN**); some school texts write **VAL** | Sum of discounted flows minus investment |
| Internal Rate of Return (IRR) | Tasso Interno di Rendimento (**TIR**) | Rate making NPV = 0 |
| Discount rate / WACC / hurdle rate | Tasso di attualizzazione / costo del capitale | The required return |
| Cash flow | Flusso di cassa | Cash in minus cash out per period |
| Break-even point | Punto di pareggio (break-even) | Volume where revenue = costs |
| Fixed / variable costs | Costi fissi / variabili | |
| Contribution margin | Margine di contribuzione | Price - variable cost per unit |
| Initial investment | Investimento iniziale (I0) | Time 0 outflow |

Terminology note: in Italian courses **VAN** and **VAL** are generally used for the same idea (net present value); confirm which your teacher uses. Here "NPV (VAL/VAN)" means the net figure (after subtracting the investment).

## 2. Formulas

Let `I0` = initial investment, `CF_t` = net cash flow in year *t* (revenue - operating costs, after the investment), `r` = discount rate, `n` = horizon in years.

| Indicator | Formula | Decision rule |
|---|---|---|
| Net cash flow | `CF_t = Revenue_t - VariableCosts_t - FixedCosts_t` | |
| ROI (total) | `ROI = (sum(CF_t) - I0) / I0` | Higher is better; compare with alternatives. Ignores timing |
| Average annual ROI | `ROI / n` | Rough only |
| Payback | Smallest *t* with `cumulative CF >= I0`; interpolate inside the year: `t-1 + (I0 - cum_{t-1}) / CF_t` | Accept if shorter than the maximum acceptable time |
| Discount factor | `1 / (1+r)^t` | |
| Discounted payback | Payback using `CF_t / (1+r)^t` | Always >= simple payback |
| NPV (VAL/VAN) | `NPV = -I0 + sum_{t=1..n} CF_t / (1+r)^t` | Accept if NPV > 0; pick the highest among alternatives |
| IRR (TIR) | rate `i` with `-I0 + sum CF_t / (1+i)^t = 0` (solved numerically) | Accept if IRR > r |
| Break-even (units) | `BEP = FixedCosts / (Price - VariableCostPerUnit)` | Round **up** to whole units |
| Break-even (revenue) | `BEP_revenue = BEP x Price = FixedCosts / (1 - VC/Price)` | |
| Margin of safety | `(ExpectedUnits - BEP) / ExpectedUnits` | Larger is safer |

Pitfalls:
- NPV/IRR depend on the horizon and on `r`; show sensitivity.
- IRR can be undefined or multiple when flows change sign several times; prefer NPV when in doubt.
- Cash flows must exclude non-cash items and include taxes where relevant (the example ignores tax for simplicity).
- Volunteer time has zero cash cost but a real opportunity cost: mention it.
- A positive NPV on invented inputs is still invented: validate the inputs ([market analysis](../analisi_mercato/FRAMEWORKS.md)).

## 3. Worked example: hypothetical hosted SaaS for schools

### 3.1 Hypothetical inputs (placeholders to be replaced)

| Input | Value | Label |
|---|---|---|
| Initial investment I0 (legal setup, domain, branding, initial hardening and pilot costs) | 10,000 EUR | HYPOTHETICAL |
| Price per school per year | 600 EUR | HYPOTHETICAL |
| Variable cost per school per year (hosting share, email, support) | 150 EUR | HYPOTHETICAL |
| Fixed costs per year (accounting, insurance, tools, base infrastructure) | 6,000 EUR | HYPOTHETICAL |
| Paying schools, years 1 to 5 | 5, 15, 30, 45, 60 | HYPOTHETICAL growth path |
| Discount rate r | 10% | HYPOTHETICAL (state your rationale) |
| Horizon | 5 years | HYPOTHETICAL |
| Taxes, inflation, churn, volunteer time | ignored | simplification |

### 3.2 Results (output of the script in section 4)

| Year | Schools | Revenue | Net cash flow | Cumulative CF - I0 | Discount factor | Discounted CF | Cumulative discounted - I0 |
|---|---|---|---|---|---|---|---|
| 0 | - | - | -10,000 | -10,000 | 1.0000 | -10,000.00 | -10,000.00 |
| 1 | 5 | 3,000 | -3,750 | -13,750 | 0.9091 | -3,409.09 | -13,409.09 |
| 2 | 15 | 9,000 | 750 | -13,000 | 0.8264 | 619.83 | -12,789.26 |
| 3 | 30 | 18,000 | 7,500 | -5,500 | 0.7513 | 5,634.86 | -7,154.40 |
| 4 | 45 | 27,000 | 14,250 | 8,750 | 0.6830 | 9,732.94 | 2,578.55 |
| 5 | 60 | 36,000 | 21,000 | 29,750 | 0.6209 | 13,039.35 | 15,617.89 |

| Indicator | Result |
|---|---|
| Sum of net cash flows (years 1-5) | 39,750 EUR |
| ROI (total, 5 years) | 297.5% (average 59.5% per year) |
| Payback | about 3.39 years |
| Discounted payback | about 3.74 years |
| NPV (VAL/VAN) at 10% | +15,617.89 EUR |
| IRR (TIR) | about 34.05% |
| Contribution margin per school | 450 EUR (600 - 150) |
| Break-even | 6,000 / 450 = 13.33, so **14 paying schools per year** to cover annual fixed costs (this excludes recovering I0) |

### 3.3 How to read it
- NPV > 0 and IRR (34%) > r (10%): **under these hypothetical inputs** the project creates value; payback is slow (3.4 years) because year 1 is negative.
- The result is dominated by the growth path (schools per year). The sensible next step is a sensitivity run: e.g. halve the school counts, or the price, and see when NPV turns negative. Edit the inputs in the script and re-run.
- Reality check: the model ignores that a student team may be unable to support 60 schools, that SQLite single-instance design needs re-evaluation at scale, and that the commission on book sales is excluded (blocked until legal design, see [template_fattibilita.md](template_fattibilita.md#4-legal-and-regulatory-feasibility)).

## 4. Script (reproducible)

Save as `roi.py` and run `python3 roi.py`. Only the standard library is used.

```python
# HYPOTHETICAL inputs - replace with validated data
I0 = 10000        # initial investment (EUR)
r = 0.10          # discount rate
price = 600       # EUR per school per year
var = 150         # variable cost per school per year
fixed = 6000      # fixed costs per year
schools = [5, 15, 30, 45, 60]

cf = [s * (price - var) - fixed for s in schools]
flows = [-I0] + cf

def npv(rate, f):
    return sum(c / (1 + rate) ** t for t, c in enumerate(f))

# IRR by bisection (valid here: one sign change in the flows)
lo, hi = 0.0, 10.0
for _ in range(200):
    mid = (lo + hi) / 2
    lo, hi = (mid, hi) if npv(mid, flows) > 0 else (lo, mid)
irr = mid

cum = dcum = 0.0
payback = dpayback = None
for t, c in enumerate(cf, 1):
    d = c / (1 + r) ** t
    if payback is None and cum + c >= I0:
        payback = t - 1 + (I0 - cum) / c
    if dpayback is None and dcum + d >= I0:
        dpayback = t - 1 + (I0 - dcum) / d
    cum += c
    dcum += d

total = sum(cf)
print("Net cash flows:", cf)
print(f"NPV at {r:.0%}: {npv(r, flows):,.2f}")
print(f"IRR: {irr:.2%}")
print(f"Payback: {payback:.2f} y, discounted: {dpayback:.2f} y")
print(f"ROI total: {(total - I0) / I0:.1%}")
print(f"Break-even schools: {fixed / (price - var):.2f}")
```

Spreadsheet equivalents: NPV -> `=VAN(rate; flows_1_to_n) - I0` (Italian Excel) / `=NPV(rate, flows) - I0`; IRR -> `=TIR.COST(flows_0_to_n)` / `=IRR(flows)`. Note: the spreadsheet NPV function discounts the first value by one period, so subtract `I0` separately as shown.
