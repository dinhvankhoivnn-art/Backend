# Thiết kế Snippets Bootstrap v5 với Tham số Động

## Tổng quan
Extension sẽ cung cấp các code snippets với tham số động để tăng tốc độ phát triển Bootstrap v5.

## Cấu trúc Snippets với Tham số Động

### 1. Grid System
```json
{
  "row": {
    "prefix": "row",
    "body": [
      "<div class=\"row\">",
      "\t<div class=\"col-${1:md}-${2:6}\">$3</div>",
      "\t<div class=\"col-${1:md}-${4:6}\">$5</div>",
      "</div>"
    ],
    "description": "Bootstrap row với 2 cột động"
  },
  "col": {
    "prefix": "col",
    "body": "<div class=\"col-${1:md}-${2:6}\">$3</div>",
    "description": "Bootstrap column với breakpoint và size động"
  }
}
```

### 2. Buttons
```json
{
  "btn": {
    "prefix": "btn",
    "body": "<button type=\"button\" class=\"btn btn-${1:primary}${2: btn-${3:md}}\"${4: id=\"$5\"}>${6:Button Text}</button>",
    "description": "Bootstrap button với style, size động"
  },
  "btn-outline": {
    "prefix": "btn-outline",
    "body": "<button type=\"button\" class=\"btn btn-outline-${1:primary}${2: btn-${3:md}}\"${4: id=\"$5\"}>${6:Button Text}</button>",
    "description": "Bootstrap outline button với style, size động"
  }
}
```

### 3. Colors & Backgrounds
```json
{
  "bg": {
    "prefix": "bg",
    "body": "<div class=\"bg-${1:primary} ${2:text-white}\">$3</div>",
    "description": "Background color với text color động"
  },
  "text": {
    "prefix": "text",
    "body": "<span class=\"text-${1:primary}\">$2</span>",
    "description": "Text color động"
  }
}
```

### 4. Alerts
```json
{
  "alert": {
    "prefix": "alert",
    "body": [
      "<div class=\"alert alert-${1:dismissible} alert-${2:primary}\" role=\"alert\">",
      "\t${3:Alert message}",
      "\t${1:dismissible}<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\"></button>${1:dismissible}",
      "</div>"
    ],
    "description": "Bootstrap alert với dismissible option"
  }
}
```

### 5. Cards
```json
{
  "card": {
    "prefix": "card",
    "body": [
      "<div class=\"card\">",
      "\t${1:<img src=\"...\" class=\"card-img-top\" alt=\"...\">}",
      "\t<div class=\"card-body\">",
      "\t\t<h5 class=\"card-title\">${2:Card title}</h5>",
      "\t\t<p class=\"card-text\">${3:Card content}</p>",
      "\t\t<a href=\"#\" class=\"btn btn-primary\">${4:Go somewhere}</a>",
      "\t</div>",
      "</div>"
    ],
    "description": "Bootstrap card với optional image"
  }
}
```

### 6. Forms
```json
{
  "form-group": {
    "prefix": "form-group",
    "body": [
      "<div class=\"mb-3\">",
      "\t<label for=\"${1:inputId}\" class=\"form-label\">${2:Label}</label>",
      "\t<input type=\"${3:text}\" class=\"form-control\" id=\"${1:inputId}\" ${4:placeholder=\"${5:Placeholder}\"}>",
      "</div>"
    ],
    "description": "Form group với label và input động"
  }
}
```

### 7. Navigation
```json
{
  "navbar": {
    "prefix": "navbar",
    "body": [
      "<nav class=\"navbar navbar-expand-${1:lg} navbar-light bg-${2:light}\">",
      "\t<div class=\"container${3:-fluid}\">",
      "\t\t<a class=\"navbar-brand\" href=\"#\">${4:Brand}</a>",
      "\t\t<button class=\"navbar-toggler\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#navbarNav\">",
      "\t\t\t<span class=\"navbar-toggler-icon\"></span>",
      "\t\t</button>",
      "\t\t<div class=\"collapse navbar-collapse\" id=\"navbarNav\">",
      "\t\t\t<ul class=\"navbar-nav\">",
      "\t\t\t\t<li class=\"nav-item\">",
      "\t\t\t\t\t<a class=\"nav-link ${5:active}\" href=\"#\">${6:Home}</a>",
      "\t\t\t\t</li>",
      "\t\t\t</ul>",
      "\t\t</div>",
      "\t</div>",
      "</nav>"
    ],
    "description": "Bootstrap navbar với breakpoint và theme động"
  }
}
```

### 8. Typography
```json
{
  "display": {
    "prefix": "display",
    "body": "<h${1:1} class=\"display-${1:1}\">${2:Display heading}</h${1:1}>",
    "description": "Display heading với level động"
  },
  "lead": {
    "prefix": "lead",
    "body": "<p class=\"lead\">$1</p>",
    "description": "Lead paragraph"
  }
}
```

### 9. Tables
```json
{
  "table": {
    "prefix": "table",
    "body": [
      "<table class=\"table table-${1:striped}\">",
      "\t<thead>",
      "\t\t<tr>",
      "\t\t\t<th scope=\"col\">${2:#}</th>",
      "\t\t\t<th scope=\"col\">${3:Header}</th>",
      "\t\t</tr>",
      "\t</thead>",
      "\t<tbody>",
      "\t\t<tr>",
      "\t\t\t<th scope=\"row\">${4:1}</th>",
      "\t\t\t<td>${5:Data}</td>",
      "\t\t</tr>",
      "\t</tbody>",
      "</table>"
    ],
    "description": "Bootstrap table với variant động"
  }
}
```

### 10. Modals
```json
{
  "modal": {
    "prefix": "modal",
    "body": [
      "<!-- Button trigger modal -->",
      "<button type=\"button\" class=\"btn btn-primary\" data-bs-toggle=\"modal\" data-bs-target=\"#${1:exampleModal}\">",
      "\t${2:Launch modal}",
      "</button>",
      "",
      "<!-- Modal -->",
      "<div class=\"modal fade\" id=\"${1:exampleModal}\" tabindex=\"-1\">",
      "\t<div class=\"modal-dialog\">",
      "\t\t<div class=\"modal-content\">",
      "\t\t\t<div class=\"modal-header\">",
      "\t\t\t\t<h5 class=\"modal-title\">${3:Modal title}</h5>",
      "\t\t\t\t<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\"></button>",
      "\t\t\t</div>",
      "\t\t\t<div class=\"modal-body\">",
      "\t\t\t\t<p>${4:Modal body text}</p>",
      "\t\t\t</div>",
      "\t\t\t<div class=\"modal-footer\">",
      "\t\t\t\t<button type=\"button\" class=\"btn btn-secondary\" data-bs-dismiss=\"modal\">${5:Close}</button>",
      "\t\t\t\t<button type=\"button\" class=\"btn btn-primary\">${6:Save changes}</button>",
      "\t\t\t</div>",
      "\t\t</div>",
      "\t</div>",
      "</div>"
    ],
    "description": "Bootstrap modal với ID động"
  }
}
```

## Các Tham số Động Chính

1. **Breakpoints**: `sm`, `md`, `lg`, `xl`, `xxl`
2. **Sizes**: `sm`, `md`, `lg` (cho buttons)
3. **Colors**: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`
4. **Column sizes**: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `auto`
5. **Table variants**: `striped`, `bordered`, `hover`, `sm`
6. **Container types**: `container`, `container-fluid`

## Cách Sử dụng

Người dùng sẽ gõ prefix (ví dụ: `row`, `btn`, `col`) và nhấn Tab để mở snippet với các tham số động được highlight để nhập giá trị.

Ví dụ:
- Gõ `row` → Tab → Snippet mở với `col-md-6` sẵn sàng để thay đổi breakpoint và size
- Gõ `btn` → Tab → Snippet mở với `btn-primary` sẵn sàng để thay đổi màu và kích thước