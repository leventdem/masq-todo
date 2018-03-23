
(function () {
  'use strict'

  let currentNotes = []
  var ENTER_KEY = 13
  var newTodoDom = document.getElementById('new-todo')
  var STORE = 'https://sync-beta.qwantresearch.com/'
  var appURL = window.location.origin + window.location.pathname
  var regParams = {
    endpoint: STORE,
    url: appURL,
    title: 'Masq Todo app',
    desc: 'A generic app that uses Masq for storage',
    icon: 'https://camo.githubusercontent.com/8b35d12bd9682a31446b08c1483145653aa5006f/68747470733a2f2f692e696d6775722e636f6d2f715a33647130512e706e67'
  }
  var masqStore = new MasqClient(STORE)

  masqStore.onConnect().then(res => {
    getItem('notes').then(notes => {
      if (Object.keys(notes).length === 0 && notes.constructor === Object) { } else {
        currentNotes = notes
        redrawTodosUI(currentNotes)
      }
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))

  // We have to create a new todo document and enter it in the database
  /**
   * Data structure
   *   // let notes = {
  //   notes: [
  //     { title: 'Going to shopping', _id: '123154', selected: false },
  //     { title: 'Cinema this week-end', _id: '123155', selected: false }
  //   ]
  // }
   */
  const addTodo = text => {
    let todo = {
      _id: new Date().toISOString(),
      title: text,
      completed: false
    }
    currentNotes.push(todo)
    setItem('notes', currentNotes)
      .then(redrawTodosUI(currentNotes))
      .catch(err => {
        console.log(err)
      })
  }

  const checkboxChanged = (todo, event) => {
    let index = currentNotes.findIndex(x => x._id === todo._id)
    // console.log(currentNotes[index])
    currentNotes[index].completed = event.target.checked
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // User pressed the delete button for a todo, delete it
  const deleteButtonPressed = todo => {
    let index = currentNotes.findIndex(x => x._id === todo._id)
    // console.log(currentNotes[index])
    currentNotes.splice(index, 1)
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  const todoBlurred = (todo, event) => {
    let trimmedText = event.target.value.trim()
    let index = currentNotes.findIndex(x => x._id === todo._id)
    if (!trimmedText) {
      currentNotes.splice(index, 1)
    } else {
      currentNotes[index].title = trimmedText
    }
    setItem('notes', currentNotes)
    redrawTodosUI(currentNotes)
  }

  // User has double clicked a todo, display an input so they can edit the title
  const todoDblClicked = todo => {
    let div = document.getElementById('li_' + todo._id)
    let inputEditTodo = document.getElementById('input_' + todo._id)
    div.className = 'editing'
    inputEditTodo.focus()
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  const todoKeyPressed = (todo, event) => {
    if (event.keyCode === ENTER_KEY) {
      let inputEditTodo = document.getElementById('input_' + todo._id)
      inputEditTodo.blur()
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  const createTodoListItem = todo => {
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

  const redrawTodosUI = todos => {
    var ul = document.getElementById('todo-list')
    ul.innerHTML = ''
    if (todos) {
      todos.forEach(function (todo) {
        ul.appendChild(createTodoListItem(todo))
      })
    }
  }

  const newTodoKeyPressHandler = event => {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value)
      newTodoDom.value = ''
    }
  }

  const addEventListeners = () => {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false)
  }

  const delay = (ms) => {
    console.log('wait ...')
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, ms) // (A)
    })
  }

  const setItem = (key, value) => {
    return masqStore.set(key, value)
  }

  const getItem = (key) => {
    return masqStore.get(key).then(function (res) {
      // console.log('1.0', res) // prints "Hello world"
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
  addEventListeners()

  // Refresh app state following a sync event
  document.addEventListener('Sync', function (event) {
    console.log('Sync event!')
    if (masqStore) {
      getItem('notes').then(notes => {
        if (Object.keys(notes).length === 0 && notes.constructor === Object) { } else { redrawTodosUI(notes) }
      }).catch(err => console.log(err))
    }
  })
})()
