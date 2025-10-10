
# 🌿 Kit JS

> A JavaScript framework written by a dreamer.
> Not to rival the giants — but to remind us that JavaScript can still be pure, simple, and close to HTML.


**Kit JS** is a **lightweight, SSR-ready JavaScript framework** that turns your plain HTML into **reactive, component-based UI** — without any builds, bundlers, or complexity.

It was born from a small dream
to make every HTML element **alive**, **meaningful**, and **reactive** —
just by writing **HTML that feels natural again**.

No build steps.
No virtual DOM.
Just **you**, the **browser**, and **a little dream** in every line of code.


## ✨ Features

* ⚡ **Lightweight & Fast** – Minimal runtime, instant reactivity.
* 💡 **HTML-First** – Define logic, state, and events right in your markup.
* 🔄 **Reactive by Design** – Automatic DOM updates when state changes.
* 🌐 **SSR-Ready** – Perfect for server-rendered pages and hydration.
* 🔒 **Secure** – Fully compatible with **Content Security Policy (CSP)**.
* 🚀 **Zero Build Step** – No bundlers, compilers, or configs required.
* 🧩 **Declarative & Reusable** – Components are just HTML scopes.


## ⚡ Quick Start

Load Kit JS via CDN:

```html
<script src="//unpkg.com/@kitmodule/kitjs"></script>
```



## ✅ Example: Todo List

A real-world example showing how **state**, **loops**, **bindings**, and **events** can be defined directly in HTML.

```html
<body
    style="font-family: sans-serif ;background-color: #f5f5f5 ;display: flex ;justify-content: center ;padding: 40px;">

    <div data-kit-scope="$todo"
        style="background: #fff ;padding: 24px 0 ;min-width: 600px ;text-align: center ;border-radius: 12px ;box-shadow: 0 4px 10px rgba(0,0,0,0.1) ;">

        <h1 style="padding: 12px 0 ;font-size: 24px ;text-transform: capitalize;">
            Danh sách việc cần làm
        </h1>

        <div style="display: flex ;gap: 12px ;padding: 0 24px;">
            <input onkeydown="if (event.key === 'Enter') kit.$todo.add()"
                style="flex: 1 ;background: #fafafa ;border: 1px solid #ddd ;border-radius: 8px ;padding: 9px 12px ;box-shadow: 0 1px 2px rgba(0,0,0,0.05) ;font-size: 16px ;"
                data-focus-class="border-info" type="text" placeholder="Thêm việc cần làm" data-kit-model="todo">

            <button hidden
                style="background: #0d6efd ;border: none ;color: white ;border-radius: 8px ;padding: 9px 12px ;box-shadow: 0 1px 2px rgba(0,0,0,0.1) ;cursor: pointer ;"
                data-kit-event="click:add()">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>

        <div style="padding: 24px ;display: flex ;flex-direction: column ;gap: 9px;">
            <div style="display: flex ;background: #fafafa ;padding: 6px 12px ;text-align: left ;border-radius: 8px ;box-shadow: 0 1px 2px rgba(0,0,0,0.05) ;"
                data-kit-for="let (item, index) of todos ; id as $key">

                <div style="display: flex ;align-items: center ;justify-content: space-between ;gap: 6px ;width: 100%;">
                    <div style="display: flex ;align-items: center ;justify-content: space-between ;gap: 12px;">
                        <input type="checkbox" data-kit-model="item.completed">
                        <div data-kit-bind="text:$item.todo"
                            data-kit-style="text-decoration: $item.completed ? 'line-through' : 'none'">
                        </div>
                    </div>

                    <button
                        style="    border: none ;background: transparent ;color: #dc3545 ;border-radius: 6px ;padding: 6px 9px ;cursor: pointer ;transition: background 0.2s ;"
                        onmouseover="this.style.background='rgba(220,53,69,0.05)'"
                        onmouseout="this.style.background='transparent'" data-kit-event="click:del(index)">
                        xóa
                    </button>
                </div>
            </div>
        </div>

        <div style="padding: 12px 24px ;text-align: left;">
            <span data-kit-bind="completeds">0</span>
            <span>/</span>
            <span data-kit-bind="text:todos.length">0</span>
            số việc đã hoàn thành
        </div>
    </div>

     <script src="//unpkg.com/@kitmodule/kitjs"></script>

    <script>
        Kit.define("todo", {
            todo: "",
            todos: [],
            add() {
                if (this.todo.trim() === "") {
                    alert("Việc làm không được để trống"); return;
                }
                this.todos.unshift({
                    id: Math.random(),
                    todo: this.todo,
                    completed: false
                }); this.todo = "";
            },

            del(index) {
                if (index !== -1) {
                    this.todos.splice(index, 1);
                }
            },

            get completeds() {
                return this.todos.filter(todo => todo.completed).length;
            }
        });</script>
</body>
```


## 🔍 How It Works

| Attribute                | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `data-kit-scope="$todo"` | Defines a reactive scope named `$todo`.                    |
| `data-kit-model`         | Two-way binds an input to a state variable.                |
| `data-kit-event`         | Declares event listeners directly in HTML (`click:add()`). |
| `data-kit-for`           | Repeats elements based on an array (`todos`).              |
| `data-kit-bind`          | Dynamically binds text or expressions.                     |
| `data-kit-style`         | Reactively updates inline styles.                          |
| `kit.$todo`              | Access the scope instance globally for manual triggers.    |


## 🧩 Philosophy

> **Kit JS** is not built to compete.
> It exists to **remind** — that the web was always meant to be **simple, declarative, and alive**.
>
> If you believe HTML and JavaScript can be one again —
> then Kit JS is your companion in that dream.


## 🧠 License

Released under the [MIT License](https://github.com/kitmodule/kitjs/blob/master/LICENSE)

© 2025 ~ time.Now()
**Huỳnh Nhân Quốc** – Founder of [Kit Module](https://kitmodule.com)

