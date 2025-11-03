# 🌿 KitJS

> A lightweight HTML-first JavaScript framework
> for developers who want the web to stay simple reactive and seamlessly enhanced on the server

[![npm version](https://img.shields.io/npm/v/@kitmodule/kitjs.svg)](https://www.npmjs.com/package/@kitmodule/kitjs)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

### ✨ Features

⚡ Lightweight and fast with minimal runtime
💡 HTML-first meaning logic and state live directly in your markup
🔄 Reactive by design keeping DOM and data in sync automatically
🌐 SSR-ready and works seamlessly with server-rendered pages
🔒 Fully secure and compatible with Content Security Policy
🧩 No build tools required simply include a `<script>` tag

## ⚡ Quick Start

Include KitJS from a CDN

```html
<script src="https://unpkg.com/@kitmodule/kitjs"></script>
```

Or install using npm

```bash
npm install @kitmodule/kitjs
```

### Your first reactive component

```html
<div data-kit-scope="counter">
  <button data-kit-click="decrement()">-</button>
  <span data-kit-bind="count"></span>
  <button data-kit-click="increment()">+</button>
</div>

<script>
Kit.define("counter", {
  count: 0,
  increment() { this.count++ },
  decrement() { this.count-- },
})
</script>
```

✅ No build tools
✅ No virtual DOM
✅ HTML that reacts naturally

## 🧩 Core Directives

| Purpose                    | Directive or Syntax                                                        | Example                                                 |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| Define reactive scope      | `data-kit-scope="$alias"` for unique or `data-kit-scope="name"` for shared | `<div data-kit-scope="$todo">`                          |
| Bind text or expression    | `data-kit-bind`                                                            | `<span data-kit-bind="user.name">`                      |
| Two-way input binding      | `data-kit-model`                                                           | `<input data-kit-model="email">`                        |
| One-time DOM to state sync | `data-kit-sync`                                                            | `<input value="John" data-kit-sync="user.name">`        |
| Event binding              | `data-kit-click` or `data-kit-event`                                       | `<button data-kit-click="save()">`                      |
| Keyboard events            | `data-kit-keydown:enter`                                                   | `<input data-kit-keydown:enter="submit()">`             |
| Conditional display        | `data-kit-show`                                                            | `<div data-kit-show="open">`                            |
| Dynamic class binding      | `data-kit-class`                                                           | `<div data-kit-class="active ? 'bg-red' : 'bg-green'">` |
| Reactive styles            | `data-kit-style`                                                           | `<p data-kit-style="color: done ? 'green':'red'">`      |
| Loop or repeat             | `data-kit-for`                                                             | `<li data-kit-for="todo of todos">`                     |

## 💡 Example Todo List

```html
<div data-kit-scope="todo">
  <h2>Todo List</h2>
  <input data-kit-model="newTask" data-kit-keydown:enter="add()">
  <button data-kit-click="add()">Add</button>

  <ul>
    <li data-kit-for="(item, i) of todos">
      <input type="checkbox" data-kit-model="item.completed">
      <span data-kit-bind="item.text"></span>
      <button data-kit-click="remove(i)">x</button>
    </li>
  </ul>

  <div style="padding:12px 24px; text-align:left;">
    <span data-kit-bind="completeds">0</span>
    <span>/</span>
    <span data-kit-bind="text:todos.length">0</span>
    completed tasks
  </div>
</div>

<script>
Kit.define("todo", {
  newTask: "",
  todos: [],
  add() {
    if (!this.newTask.trim()) return
    this.todos.unshift({ 
         id: Math.random(),
        text: this.newTask, 
        completed: false
         })
    this.newTask = ""
  },
  remove(i) { this.todos.splice(i, 1) },
  get completeds() {
    return this.todos.filter(todo => todo.completed).length
  }
})
</script>
```

## 🔁 One-time Sync

`data-kit-sync` hydrates your state from existing DOM values making it ideal for server-rendered or static pages.

```html
<div data-kit-scope="$user">
  <input value="Alice" data-kit-sync="user.name">
  <p>Hello, <span data-kit-bind="user.name"></span>!</p>
</div>

<script>
Kit.define("user", { user: { name: "" } })
</script>
```

The `user.name` value becomes `"Alice"` automatically when the page loads.

## ⚙️ Element Spine

Each DOM element has a reactive spine exposing scope state and ownership.

| Property                 | Description                         |
| ------------------------ | ----------------------------------- |
| `$get(name)`             | Get directive value                 |
| `$set(name, value)`      | Set directive value                 |
| `$value`                 | Get or set element content or value |
| `$component`             | Owning component instance           |
| `$state`                 | Reactive state object               |
| `$find(name)`            | Query within current scope          |
| `$dispatch(type, event)` | Trigger event handlers manually     |

```js
const input = document.querySelector("input[data-kit-model='name']")
console.log(input.$state.name)
```

## 🧠 Event System

KitJS supports expressive event syntax with modifiers and variants

```html
<input data-kit-keydown:enter:stop:prevent="submit()">
<button data-kit-click:once="save()">Save</button>
```

| Modifier               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `once`                 | Run once and remove listener                 |
| `stop`                 | Call stopPropagation                         |
| `prevent`              | Call preventDefault                          |
| `debounce:300`         | Delay execution by 300 milliseconds          |
| `throttle:500`         | Limit execution to once per 500 milliseconds |
| `outside`              | Trigger when clicking outside element        |
| `window` or `document` | Attach listener globally                     |

```html
<div data-kit-scope="$modal">
  <div data-kit-show="open">Modal content</div>
  <button data-kit-click="open = true">Open</button>
  <div data-kit-click:outside="open = false"></div>
</div>
```

## 🧩 Built-in Utilities

```js
el.$dataset    // Reactive directive dataset
el.$owner()    // Nearest component root
el.$find('bind') // Query directive inside scope
```

These utilities make KitJS introspective and hackable.

## 🌐 SSR and Progressive Enhancement

```html
<div data-kit-scope="$profile">
  <h2 data-kit-bind="name">Alice</h2>
  <input value="Alice" data-kit-sync="name">
</div>

<script>
Kit.define("profile", { name: "" })
</script>
```

On hydration state automatically picks up DOM data with no mismatches and no re-rendering.

### Benefits

* Instant state recovery
* Zero hydration errors
* Works perfectly for static or server-rendered pages

## 🌱 When to Use KitJS

KitJS is not a competitor to React or Vue and it is for developers who want HTML to stay alive.

Use it when you want to:

* Build small reactive components directly in HTML
* Enhance existing pages or templates
* Create embeddable widgets or demos
* Prototype quickly without a build step
* Keep your stack framework-free

Think of it as HTML with a pulse

## 💭 Philosophy

KitJS is not built to compete.
It reminds us that the web can be simple reactive and human.
HTML and JavaScript can live as one.

KitJS is your quiet companion for reactive HTML.

## 🧩 Examples

| Example                                                 | Description              |
| ------------------------------------------------------- | ------------------------ |
| [Counter](https://github.com/kitmodule/kitjs/blob/master/example/counter.html)   | Minimal state and events |
| [Todo List](https://github.com/kitmodule/kitjs/blob/master/example/todos.html)    | Loops and bindings       |
| [Dropdown](https://github.com/kitmodule/kitjs/blob/master/example/dropdown.html) | Conditional visibility   |
| [Tags Input](https://github.com/kitmodule/kitjs/blob/master/example/tags.html)   | Dynamic list editing     |

## 💖 Funding

If you love **KitJS** and want to support its development, you can sponsor or buy me a coffee ☕  

[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/huynhnhanquoc)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/huynhnhanquoc)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-f7f7f7?style=for-the-badge&logo=githubsponsors&logoColor=ff69b4&color=f7f7f7)](https://github.com/sponsors/huynhnhanquoc)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/huynhnhanquoc)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/huynhnhanquoc)

## 🧪 License

Released under the [MIT License](LICENSE)
© 2025 [Huỳnh Nhân Quốc](https://github.com/huynhnhanquoc) · Open Source [@Kit Module](https://github.com/kitmodule)