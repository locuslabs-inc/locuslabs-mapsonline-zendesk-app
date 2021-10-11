$(function() {
    var client = ZAFClient.init();
    client.invoke('resize', { width: '100%', height: '450px' });

    client.get('ticketFields').then(
        function(data) {
            console.log('Atrius: ', data)
            ticketFields(client, data.ticketFields);
        }
    )
});

const isAtriusField = (ticketField) => {
    const atriusFields = [
        'LocusLabs Account',
        'Venue Identifier',
        'Floor Identifier',
        'Latitude',
        'Longitude',
    ]

    return atriusFields.includes(ticketField.label)
}

function ticketFields(client, ticketFields) {

    const atriusTicketFields = ticketFields.filter(isAtriusField)

    const promises = atriusTicketFields.map((ticketField) => {
        const promise = new Promise((resolve, reject) => {
            console.log('Atrius: ', ticketField.name, ticketField.label, ticketField)
            client.get(`ticket.customField:${ticketField.name}`).then( (result) => {
                resolve({ [ticketField.label] : result })
            })
        })

        return promise
    })

    Promise.all(promises).then(
        function( promises ) {
            let result = {}
            promises.forEach( promise => {
                Object.assign(result, promise);
            })
            console.log('Atrius ', result)
            const v = o => Object.values(o)[1]
            showInfo( [ v(result['LocusLabs Account']), v(result['Venue Identifier']), v(result['Floor Identifier']), v(result['Latitude']), v(result['Longitude']) ] );
        },
        function(response) {
            console.log('Atrius error: ', response)
            showError(response);
        }
    )
}

function showInfo( [ accounts, venue, floor, latitude, longitude ] ) {

    console.log('Atrius data: ', accounts, venue, floor, latitude, longitude)

    
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


    console.log('Atrius firstAccount: ', firstAccount)

    const requester_data = {
        'account': firstAccount,
        'venue': venue,
        'floor': floor,
        'lat': latitude,
        'lng': longitude,
    };
    console.log('Atrius ', requester_data)
    var source = $("#requester-template").html();
    var template = Handlebars.compile(source);
    var html = template(requester_data);
    $("#content").html(html);

    setTimeout(
        () => {
            var config = {
                venueId: venue,
                accountId: firstAccount
            }
        
        
            LMInit.setLogging(true);
            LMInit.newMap('.locusmaps', config)
                .then(map => {
                    map.setPosition({ lat: latitude, lng: longitude, floorId: floor, zoom: 17})
                    return map.getPosition()
                        .then(pos => map.drawMarker(
                            "Map Note Placement",
                            {
                                lat: latitude,
                                lng: longitude,
                                ord: pos.ord
                            },
                            'https://img.locuslabs.com/js/misc/map-note-pin.svg'
                        ))
                })
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