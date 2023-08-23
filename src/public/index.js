import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const btn = document.getElementById('btn');
const prompt = document.getElementById('prompt');
const conversation = document.getElementById('conversation');

const source = new EventSource(`/subscribe`, {
    withCredentials: true,
});

function renderBox(messageId, prompt, content) {
    const id = `box-${ messageId }`;
    let box = document.getElementById(id);
    if (!box) {
        box = document.createElement('div');
        box.className = 'box row col card my-2';
        box.id = id;
        conversation?.appendChild(box);
    }
    sendMessage(box, messageId, prompt);
    receiveMessage(box, messageId, content);
}

function sendMessage(box, messageId, message) {
    const exists = document.getElementById(`send-${ messageId }`);
    if (exists) return;
    const send = document.createElement('div');
    send.className = 'send bg-light p-4 fw-bold';
    send.id = `send-${messageId}`;
    send.innerText = `Q. ${ message }`;
    box.appendChild(send);
}

function receiveMessage(box, messageId, message) {
    let receive = document.getElementById(`rec-${ messageId }`);
    if (!receive) {
        receive = document.createElement('div');
        receive.id = `rec-${ messageId }`;
        receive.className = 'receive p-4 bg-secondary text-light';
        box.appendChild(receive);
    }
    receive.innerText += message;
}

function renderDate(messageId, date) {
    const id = `box-${ messageId }`;
    const box = document.getElementById(id);

    const dateBox = document.createElement('div');
    dateBox.className = 'date-box d-flex justify-content-end py-2';
    dateBox.innerText = date;
    box.appendChild(dateBox);
}

function messaging() {
    btn.disabled = true;
    prompt.readOnly = true;
}

function init() {
    console.log('init');
    prompt.value = '';
    prompt.readOnly = false;
    btn.disabled = false;
}


source.onmessage = function(event) {
    try {
        const { data } = event;
        const { content, type, messageId, prompt } = JSON.parse(data);
        if (type === 'message') {
            messaging();
            if (content !== undefined && messageId) renderBox(messageId, prompt, content);
        } else if (type === 'end') {
            const box = document.getElementById(`box-${ messageId }`);
            box?.scrollIntoView(true);
            init();
        } else if (type === 'date') {
            renderDate(messageId, content);
        }
    } catch (e) {

        init();
    }
}

async function openai(prompt) {
    try {
        const { data: { messageId } } = await axios.post('/openai', {
            prompt,
        });
    } catch (e) {
        console.log(e);
        if (e.response && e.response.status && e.response.status === 404) {
            alert(e.response.data || e.response.statusText);
            location.reload();
            return;
        }
        renderBox(`${ new Date().getTime() }`, prompt, e.message.toString());
    }
}
btn?.addEventListener('click', () => {
    openai(prompt?.value);
});

prompt?.addEventListener('keyup', (event) => {
   if (event.ctrlKey && event.key === 'Enter') openai(prompt?.value);
});
