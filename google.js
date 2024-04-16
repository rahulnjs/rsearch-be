const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fetch = require('node-fetch');

const GOOGLE_LINK = 'https://www.google.com';

async function search(q, shouldNotReverse) {
    const result = {};
    let pages = 2;
    let url = `${GOOGLE_LINK}/search?q=${q}`;
    let DOM = await google(url);
    extractSearchResults(DOM.window.document, result);
    for (let i = 1; i <= pages; i++) {
        let link = getNextPageLink(DOM);
        if (link.startsWith('/search?q')) {
            url = GOOGLE_LINK + link;
            DOM = await google(url);
            extractSearchResults(DOM.window.document, result);
        }
    }
    let targetKey = '', n = 0;
    for (let key of Object.keys(result)) {
        if (n < result[key].length) {
            targetKey = key;
            n = result[key].length;
        }
    }
    if (shouldNotReverse) {
        result[targetKey].reverse()
    }
    const j = divToJSON(result[targetKey]);
    return j;
}

module.exports = search;


function getNextPageLink(DOM) {
    const nextBtn = DOM.window.document.querySelectorAll('[aria-label="Next page"]')[0];
    return nextBtn.attributes['href'].nodeValue;
}

async function google(url) {
    const res = await fetch(url);
    const html = await res.text();
    return new JSDOM(html);
}

function extractSearchResults(document, result) {
    const divs = document.querySelectorAll('#main>div');
    const l = divs.length;
    for (let i = l - 1; i >= 0; i--) {
        const d = divs[i];
        if (d.firstChild && d.firstChild.classList) {
            const key = d.firstChild.classList['value'];
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(d.firstChild);
        }
    }
    return result;
}


function divToJSON(divs) {
    const json = [];
    for (let div of divs) {
        const obj = {};
        const [first, second] = div.childNodes;
        const a = getAnchorTag(first);
        const [one, two] = a.firstChild.childNodes;
        obj.desc = text(second.textContent);
        obj.link = linked(a.href);
        obj.h3 = text(one.textContent);
        obj.breadcrumb = text(two.textContent);
        json.push(obj);
    }

    return json;

    function text(t) {
        return t.replaceAll('�', '|');
    }

    function getAnchorTag(div) {
        let a = div;
        while (a.tagName !== 'A') {
            a = a.firstChild;
        }
        return a;
    }

    function linked(url) {
        const [p1] = url.split('&sa=');
        return p1.replace('/url?q=', '');
    }
}