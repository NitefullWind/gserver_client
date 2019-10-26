$(function() {
    var webClient = io("www.nitefullwind.cn:3001")

    webClient.on('connect', () => {
        console.log(`webclient connect id: ${webClient.id}`)
    })
    
    webClient.on('connect_error', () => {
        console.log(`webclient connect_error`)
    })

    webClient.on('connect_timeout', () => {
        console.log(`webclient connect_timeout`)
    })

    webClient.on('error', () => {
        console.log(`webclient error`)
    })

    webClient.on('disconnect', () => {
        console.log("webclient disconnect")
    })

    webClient.on('reconnect', () => {
        console.log(`webclient reconnect`)
    })

    webClient.on('connect_tcp', () => {
        console.log('on connect_tcp')
    })

    $('#btn_send').click(() => {
        console.log($('#input_message').val())
        webClient.send( $('#input_message').val())
    })
    
    $('#btn_connect_server').click(() => {
        webClient.open()
    })
})