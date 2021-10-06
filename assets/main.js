$(function() {
    var client = ZAFClient.init();
    client.invoke('resize', { width: '100%', height: '450px' });

    client.get('ticketFields').then(
        function(data) {
            ticketFields(client, data.ticketFields);
        }
    )

});

function ticketFields(client, ticketFields) {

    const promises = [];

    for(const ticketField of ticketFields) {

        switch(ticketField.label) {
            case 'LocusLabs Account':
            case 'Venue Identifier':
            case 'Floor Identifier':
            case 'Latitude':
            case 'Longitude':
                const promise = new Promise( (resolve, reject) => {
                    client.get(`ticket.customField:${ticketField.name}`).then( (result) => {
                        resolve({ [ticketField.label] : result })
                    })
                } )
                promises.push(promise)
                break;
            default:
                break;
        }
    }

    // console.log('ticketField: ', ticketField.name)

    Promise.all(promises).then(
        function( promises ) {
            let result = {}
            promises.forEach( promise => {
                Object.assign(result, promise);
            })
            console.log(result)
            const v = o => Object.values(o)[1]
            showInfo( [ v(result['LocusLabs Account']), v(result['Venue Identifier']), v(result['Floor Identifier']), v(result['Latitude']), v(result['Longitude']) ] );
        },
        function(response) {
            console.log('error: ', response)
            showError(response);
        }
    )
}

function showInfo( [ accounts, venue, floor, latitude, longitude ] ) {

    console.log('data: ', accounts, venue, floor, latitude, longitude)

    let firstAccount;
    try {
        firstAccount = JSON.parse(accounts)[0];
    } catch (exception) {
        const comma = accounts.indexOf(',');
        if ( comma === -1 ) {
            firstAccount = accounts;
        } else {
            firstAccount = accounts.substring(0, accounts.indexOf(',')).trim();
        }
    }

    console.log('firstAccount: ', firstAccount)

    const requester_data = {
        'account': firstAccount,
        'venue': venue,
        'floor': floor,
        'lat': latitude,
        'lng': longitude,
    };
    console.log(requester_data)
    var source = $("#requester-template").html();
    var template = Handlebars.compile(source);
    var html = template(requester_data);
    $("#content").html(html);

    setTimeout(
        () => {
            //window.LocusMaps({command: 'version'}).then(console.log)
            //window.LocusMaps({command: "drawMarker", name: "Map Note Placement", lat: latitude, lng: longitude, imageURL: `https://img.locuslabs.com/js/misc/map-note-pin.svg`})
            map.getPosition()
                .then(pos => window.LLMap.drawMarker(
                    "Map Note Placement",
                    {
                        lat: latitude,
                        lng: longitude,
                        ord: pos.ord
                    },
                    'https://img.locuslabs.com/js/misc/map-note-pin.svg'
                    ))
        },
        5000
    )
}

function showError(response) {
    var error_data = {
        'status': response.status,
        'statusText': response.statusText
    };
    var source = $("#error-template").html();
    var template = Handlebars.compile(source);
    var html = template(error_data);
    $("#content").html(html);
}

function formatDate(date) {
    var cdate = new Date(date);
    var options = {
        year: "numeric",
        month: "short",
        day: "numeric"
    };
    date = cdate.toLocaleDateString("en-us", options);
    return date;
}