import Combobox from './Components/Combobox/Combobox.js';
import agenciesList from './data/agencies.js';
import params from './data/params.js';

// CSS
import './css/normalize.css';
import './css/postmedia.css';
import './css/colors.css';
import './css/fonts.css';
import './css/main.css';
import './css/cloudtable.css';

// FONTS
import './fonts/Shift-Bold.otf';
import './fonts/Shift-BoldItalic.otf';
import './fonts/BentonSansCond-Regular.otf';
import './fonts/BentonSansCond-RegItalic.otf';
import './fonts/BentonSansCond-Bold.otf';


// VARS
let server;
let serverPool;


// JS FUNCTIONS
const init = async () => {
    // assign server - HACK!!! DISABLE WHEN TRAFFIC DROPS
    // serverPool = params.serverPool;
    // server = await assignServer(serverPool);

    server = params.cloudTableDomain;

    // create dynamic list of options for agency select tag
    createAgencyComboBox(agenciesList);

    // create combobox filter for agencies
    Combobox('#combobox');
    $('#combobox').change(comboboxChangeHandler);

    // load the unfiltered cloudtable
    loadCloudTable('');
};

// super-hack "load balancer"
function assignServer(serverPool) {
    let server;
    // const date = new Date();
    // const current_min = date.getMinutes();

    // if (current_min % 2 == 0) {
    //     server = params.cloudTableDomain;
    // } else {
    //     server = params.cloudTableDomain_v2;
    // }
    if (serverPool.length == 0) {
        // re-assign server pool & pull sever from pool
    } else {
        // pull server from pool
        server = serverPool.pop();
    }

    // return server
    return server;
}

function comboboxChangeHandler(e) {
    // reset container dom element
    $('.cloudtables')[0].textContent = '';

    // reload the table with selected agency filtered
    const filterValue = e.target.value === 'All agencies' ? null : e.target.value;

    // reload table
    loadCloudTable(filterValue);
}

function createAgencyComboBox(agenciesList) {
    let agenciesString = '';

    // sort our list
    const list = agenciesList.sort();
    list.unshift('All agencies');

    list.forEach(d => {
        agenciesString += `<option value='${d}'>${d}</option>`;
    });
    
    $('#combobox').append(agenciesString);
}

async function loadCloudTable(agency) {
    let conditionsArray = [
        {
            id: params.agencyId, 
            value: agency
        }
    ];

    // if the filter has been selected, filter for those options, otherwise show everything (null)
    let conditions = agency ? conditionsArray : null;

    // console.log(`https://${server}/io/loader/${params.cloudTableId}/table/d`)
    // CloudTables' npm client uses Node's https module, so request the token
    // with the browser's native fetch API instead.
    let token = await getCloudTableToken(conditions);
    // build the script tag for the table
    let script = document.createElement('script');
    script.src = `https://${server}/io/loader/${params.cloudTableId}/table/d`;
    script.setAttribute('data-token', token);
    script.setAttribute('data-insert', params.tableId);
    script.setAttribute('data-clientId', params.clientId);

    // insert the script tag to load the table
    document.getElementById(params.appId).appendChild(script);
}

async function getCloudTableToken(conditions) {
    const form = new URLSearchParams({
        key: params.apiKey,
        clientName: params.clientId
    });

    if (conditions) {
        conditions.forEach((condition, index) => {
            form.append(`conditions[${index}][id]`, condition.id);
            form.append(`conditions[${index}][value]`, condition.value);
        });
    }

    const response = await fetch(`https://${server}/io/api/1/access`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
    });

    if (!response.ok) {
        throw new Error(`CloudTables token request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors || !data.token) {
        throw new Error('CloudTables token response did not contain a token');
    }

    return data.token;
}

// KICK *SHT OFF!!!
init();