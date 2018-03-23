
(function () {
  'use strict'

  let firstTime = false
  let currentNotes = []

  const apiData = {
    POI_1: 'Tour eiffel',
    POI_2: 'Bastille',
    POI_3: 'Cafeteria'
  }

  console.log(window)
  var STORE = 'https://sync-beta.qwantresearch.com/'
  var masqStore = new MasqClient(STORE)

  var ENTER_KEY = 13
  var newTodoDom = document.getElementById('new-todo')

  // We have to create a new todo document and enter it in the database
  function addTodo (text) {
    var todo = {
      _id: new Date().toISOString(),
      title: text,
      completed: false
    }
    currentNotes.push(todo)
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // Show the current list of todos by reading them from the database
  function showTodos () {
    dbData.allDocs({ include_docs: true, descending: true }, function (err, doc) {
      console.log(doc)
      redrawTodosUI(doc.rows)
    })
  }

  function checkboxChanged (todo, event) {
    let index = currentNotes.findIndex(x => x._id === todo._id)
    console.log(currentNotes[index])
    currentNotes[index].completed = event.target.checked
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed (todo) {
    let index = currentNotes.findIndex(x => x._id === todo._id)
    console.log(currentNotes[index])
    currentNotes.splice(index, 1)
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred (todo, event) {
    var trimmedText = event.target.value.trim()
    if (!trimmedText) {
      dbData.remove(todo)
    } else {
      todo.title = trimmedText
      dbData.put(todo)
    }
  }

  // Initialise a sync with the remote server
  function sync () {
    syncDom.setAttribute('data-sync-state', 'syncing')
    var opts = { live: true }
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // var dbData = new PouchDB('todos')
  // var remoteCouch = ''

  // There was some form or error syncing
  function syncError () {
    syncDom.setAttribute('data-sync-state', 'error')
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked (todo) {
    var div = document.getElementById('li_' + todo._id)
    var inputEditTodo = document.getElementById('input_' + todo._id)
    div.className = 'editing'
    inputEditTodo.focus()
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed (todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id)
      inputEditTodo.blur()
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  function createTodoListItem (todo) {
    console.log('1.2', todo)
    var checkbox = document.createElement('input')
    checkbox.className = 'toggle'
    checkbox.type = 'checkbox'
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo))

    var label = document.createElement('label')
    label.appendChild(document.createTextNode(todo.title))
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo))

    var deleteLink = document.createElement('button')
    deleteLink.className = 'destroy'
    deleteLink.addEventListener('click', deleteButtonPressed.bind(this, todo))

    var divDisplay = document.createElement('div')
    divDisplay.className = 'view'
    divDisplay.appendChild(checkbox)
    divDisplay.appendChild(label)
    divDisplay.appendChild(deleteLink)

    var inputEditTodo = document.createElement('input')
    inputEditTodo.id = 'input_' + todo._id
    inputEditTodo.className = 'edit'
    inputEditTodo.value = todo.title
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo))
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo))

    var li = document.createElement('li')
    li.id = 'li_' + todo._id
    li.appendChild(divDisplay)
    li.appendChild(inputEditTodo)

    if (todo.completed) {
      li.className += 'complete'
      checkbox.checked = true
    }

    return li
  }

  function redrawTodosUI (todos) {
    var ul = document.getElementById('todo-list')
    ul.innerHTML = ''
    console.log('0.2', todos)
    if (todos) {
      todos.forEach(function (todo) {
        // console.log("0.3", todo)
        // ul.appendChild(createTodoListItem(todo))
        ul.appendChild(createTodoListItem(todo))
      })
    }
  }

  function newTodoKeyPressHandler (event) {
    if (event.keyCode === ENTER_KEY) {
      console.log(('press key'))
      addTodo(newTodoDom.value)
      newTodoDom.value = ''
    }
  }

  function addEventListeners () {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false)
  }

  const delay = (ms) => {
    console.log('wait ...')
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, ms) // (A)
    })
  }

  const setItem = (key, value) => {
    console.log('receive', value)
    // masqStore.get(key).then(function (actualNotes) {
    //   console.log('actual', actualNotes)
    //   actualNotes.push(value)
    //   console.log('new', actualNotes)
    masqStore.set(key, value)
      .then(() => {
        // success
        console.log('done')
      })
      .catch(err => {
        console.log(err)
      })
  }

  // var STORE = 'https://sync-beta.qwantresearch.com/'
  var appURL = window.location.origin + window.location.pathname
  var regParams = {
    endpoint: STORE,
    url: appURL,
    title: 'Masq Todo app',
    desc: 'A generic app that uses Masq for storage',
    icon: 'https://camo.githubusercontent.com/8b35d12bd9682a31446b08c1483145653aa5006f/68747470733a2f2f692e696d6775722e636f6d2f715a33647130512e706e67'
  }

  const getItem = (key) => {
    return masqStore.get(key).then(function (res) {
      console.log(res) // prints "Hello world"
      if (res) {
        return res
      } else { return [] }
    }).catch(function (err) {
      if (err.message === 'UNREGISTERED') {
        masqStore.registerApp(regParams).then(function (e) {
          // window.location.reload()
          getItem(key)
        })
      }
      console.log(err.message)
    })
  }

  const getAll = (key) => {
    return masqStore.getAll(key).then(function (res) {
      console.log(res) // prints "Hello world"
      if (res) {
        return res
      } else { return [] }
    }).catch(function (err) {
      if (err.message === 'UNREGISTERED') {
        masqStore.registerApp(regParams).then(function (e) {
          // window.location.reload()
          getItem(key)
        })
      }
      console.log(err.message)
    })
  }

  masqStore.onConnect().then(res => {
    getAll('notes').then(notes => {
      if (Object.keys(notes).length === 0 && notes.constructor === Object) { } else {
        currentNotes = notes.notes
        redrawTodosUI(notes.notes)
      }
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))

  addEventListeners()
  handshake()
  initDB()
  // delay(1000).then(() => {
  //   setItem('notes', [10, 20])
  // })

  let notes = {
    rows: [
      { title: 'Going to shopping', _id: '123154', selected: false },
      { title: 'Cinema this week-end', _id: '123155', selected: false }
    ]
  }

  if (firstTime) {
    setItem('notes', notes)
  }

  // redrawTodosUI(notes.rows)
  // showTodos()

  // /**
  // *  Receive messages from contentscript
  // *  Transfer them to webpage.
  // */
  // window.addEventListener('message', function (event) {
  //   // We only accept messages from ourselves
  //   let parsedData = null
  //   if (event.source != window) { return }

  //   if (event.data.to && (event.data.to == 'webpage')) {
  //     switch (event.data.type) {
  //       case 'handshake_ack':
  //         console.log('Webpage script : ')
  //         console.log(`${event.data.to} receives a ${event.data.type} from ${event.data.from}`)
  //         //   console.log("Content script sends this message to backgound: " + event.data)

  //         break
  //       case 'set_ack':
  //         console.log('Webpage script : ')
  //         console.log(`${event.data.to} receives a ${event.data.type} from ${event.data.from}`)
  //         //   console.log("Content script sends this message to backgound: " + event.data)

  //         break
  //       case 'get_ack':
  //         parsedData = JSON.parse(event.data.data)
  //         console.log('Webpage script : ')
  //         console.log(`${event.data.to} receives a ${event.data.type} from ${event.data.from}`)
  //         console.log()
  //         if (parsedData.value) {
  //           currentNotes = parsedData.value
  //         }
  //         redrawTodosUI(currentNotes)
  //         //   console..datalog("Content script sends this message to backgound: " + event.data)

  //         break

  //       default:
  //         break
  //     }
  //   }
  // }, false)

  // Refresh app state following a sync event
  document.addEventListener('Sync', function (event) {
    console.log('Sync event!')
    if (masqStore) {
      getAll('notes').then(notes => {
        if (Object.keys(notes).length === 0 && notes.constructor === Object) { } else { redrawTodosUI(notes.notes) }
      }).catch(err => console.log(err))
    }
  })
})()
