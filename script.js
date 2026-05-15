const apiKey = "53f88af2f06bd470214a0cc4";
const baseUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

const banks = {
    ABC: { buy: 0.01, sell: -0.005 },
    NEW: { buy: 0.02, sell: -0.01 },
    AME: { buy: 0.015, sell: -0.015 },
    RED: { buy: 0.005, sell: -0.005 }
};

let rates = {};
let fromCurrency = "RUB";
let toCurrency = "USD";
let activeBank = "NEW";
let lastEdited = 'from';

const fromInput = document.getElementById('from-input');
const toInput = document.getElementById('to-input');
const fromRateInfo = document.getElementById('from-rate-info');
const toRateInfo = document.getElementById('to-rate-info');
const offlineNotice = document.getElementById('offline-notification');

function offlineFunction(show) {
    if (offlineNotice) {
        if (show === true) {
            offlineNotice.style.display = 'block';
        }
        else {
            offlineNotice.style.display = 'none';

        }
    }
}
//   offlineNotice.style.display = show ? 'block' : 'none';


function validateInput(inputElement) {
    let value = inputElement.value;
    value = value.replace(',', '.');
    value = value.replace(/[^0-9.]/g, '');

     let num = value.split('.');
    if (num.length > 2) {
        value = num[0] + '.' + num.slice(1).join('');
    }

    if (num.length === 2 && num[1].length > 4) {
        value = num[0] + '.' + num[1].slice(0, 4);
    }

    if (Number(value) > 10000) {
        value = "10000";
    }

    inputElement.value = value;
    return value;
}


function getRates() {
    // Если выбрали одинаковые валюты, не нужно ничего запрашивать, просто ставим курс 1 и считаем.
    if (fromCurrency === toCurrency) {
        rates = { [toCurrency]: 1 };
        calculate(lastEdited);
        return;
     }

    fetch(`${baseUrl}${fromCurrency}`)
       .then(response => {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error();
    }
})
        .then(data => {
            if (data.result === "success") {
                rates = data.conversion_rates;
                localStorage.setItem(`rates_${fromCurrency}`, JSON.stringify(rates));
                offlineFunction(false);
                calculate(lastEdited);
            }
        })
        .catch(() => {
            offlineFunction(true);
            loadFromCache();
        });
}

function loadFromCache() {
    const cached = localStorage.getItem(`rates_${fromCurrency}`);
    if (cached) {
        rates = JSON.parse(cached);
        calculate(lastEdited);
    }
}
//
function calculate(direction) {
    lastEdited = direction;
    let currentRate = rates[toCurrency];
    if (!currentRate) return;

    let reverseRate = 1 / currentRate;

    if (direction === 'from') {
        let val = validateInput(fromInput);
        if (val === "" || val === ".") {
            toInput.value = "";
            updateBankInfo();
            return;
        }
        toInput.value = (Number(val) * currentRate).toFixed(4);
    } else {
        let val = validateInput(toInput);
        if (val === "" || val === ".") {
            fromInput.value = "";
            updateBankInfo();
            return;
        }
        fromInput.value = (Number(val) * reverseRate).toFixed(4);
    }
fromRateInfo.innerText =
        "1 " + fromCurrency + " = " +
        currentRate.toFixed(4) + " " +
        toCurrency;

    toRateInfo.innerText =
        "1 " + toCurrency + " = " +
        reverseRate.toFixed(4) + " " +
        fromCurrency;

    updateBankInfo();
}


function updateBankInfo() {
    let comm = banks[activeBank];


    // Если последний раз меняли правый инпут, считаем вот это все от него.
    let amount;
     if (lastEdited === 'from'){
        amount = Number(toInput.value) || 0;}
        else{
         amount =Number(fromInput.value) || 0;
        }

    //  BUY  и SELL 
    let buy = amount * (1 - Math.abs(comm.buy));
    let sell = amount * (1 + Math.abs(comm.sell));

    // Если мы меняли ПРАВЫЙ инпут, то BUY/SELL показывают сколько это в ЛЕВОЙ валюте.
    // Если ЛЕВЫЙ — то в ПРАВОЙ. 
    document.getElementById('buy-value').innerText = amount > 0 ? buy.toFixed(4) : "0.00";
    document.getElementById('sell-value').innerText = amount > 0 ? sell.toFixed(4) : "0.00";
}

function setupButtons(containerId, type) {
    let buttons = document.querySelectorAll(`#${containerId} button`);
    Array.from(buttons).map(btn => {
        btn.addEventListener('click', () => {
            let currentCurrency;
            if (type === 'from') {
                currentCurrency = fromCurrency;
            } else {
                currentCurrency = toCurrency;
            }
            
            if (btn.innerText === currentCurrency && (type === 'bank') === false) {
                return;
            }
            Array.from(buttons).map(b => {
                b.classList.remove('active');
                return b;
            });

            btn.classList.add('active');
            if (type === 'from') {
                fromCurrency = btn.innerText;
            } else if (type === 'to') {
                toCurrency = btn.innerText;
            } else if (type === 'bank') {
                activeBank = btn.innerText;
            }

            getRates();
        });
        
        return btn;
    });
} 

fromInput.oninput = () => calculate('from');
toInput.oninput = () => calculate('to');

fromInput.onfocus = () => { lastEdited = 'from'; };
toInput.onfocus = () => { lastEdited = 'to'; };

window.addEventListener('online', () => {
    offlineFunction(false);
    getRates();
});
window.addEventListener('offline', () => offlineFunction(true));

setupButtons('from-tabs', 'from');
setupButtons('to-tabs', 'to');
setupButtons('bank-tabs', 'bank');

getRates();