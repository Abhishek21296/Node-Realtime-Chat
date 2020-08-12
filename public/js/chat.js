const socket = io()

//elements
const form = document.querySelector('#message-form')
const messageInput = form.querySelector('input')
const button = form.querySelector('button')

const messagesIncoming = document.querySelector('#messages')

const locButton = document.querySelector('#send-location')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

socket.on('onLocation', data => {
    const html = Mustache.render(locationTemplate, {username: data.username, url : data.text, createdAt : moment(data.createdAt).format('h:mm a')})
    messagesIncoming.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (data)=> {
    console.log(data)
    const html = Mustache.render(messageTemplate, {username: data.username, actualMessage : data.text, createdAt : moment(data.createdAt).format('h:mm a')})
    messagesIncoming.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    console.log(room)
    console.log(users)
    const html= Mustache.render(sidebarTemplate, { room, users})
    document.querySelector('#sidebar').innerHTML = html
})

//sending message here
form.addEventListener('submit', (e) => {
    e.preventDefault() //stops from reloading
    button.setAttribute('disabled', 'disabled')
    const msg = messageInput.value
    socket.emit('sendMessage', msg, (error) => {
        button.removeAttribute('disabled')
        if(error){
            return console.log(error)
        }
        console.log('Delivered')
        messageInput.value = ''
        messageInput.focus()
    })
})

//sending location here
locButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Not supported by your browser')
    }
    locButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const pos = { lat : position.coords.latitude, long : position.coords.longitude}
        socket.emit('location', pos, (a) => {
            locButton.removeAttribute('disabled')
            console.log('shared')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert('error')
        location.href = '/'
    }
})

const autoscroll = () => {
    //new msg
    const newMsg = messagesIncoming.lastElementChild

    //new msg height
    const newMsgStyles = getComputedStyle(newMsg)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = newMsg.offsetHeight + newMsgMargin

    //visible height
    const visibleHeight = messagesIncoming.offsetHeight

    //container height
    const containerHeight = messagesIncoming.scrollHeight

    //how far scrolled
    const scrollOffset = messagesIncoming.scrollTop + visibleHeight

    if(containerHeight - newMsgHeight <= scrollOffset){
        messagesIncoming.scrollTop = messagesIncoming.scrollHeight
    }
}