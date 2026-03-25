# SDOptimizer Frontend

Frontend web de SDOptimizer para gestionar modelos de Dinámica de Sistemas en formato Vensim `.mdl` y preparar su optimización con enfoque **DRL + Greedy Algorithm**.

## 📋 Overview

Este frontend permite actualmente:
- Subir modelos `.mdl`.
- Validar y registrar modelos en backend.
- Listar modelos cargados por sesión.
- Ver detalles de cada modelo (variables y metadatos parseados).
- Eliminar modelos.
- Manejar archivos duplicados al subir (`Replace` / `Keep both`).

## 🎯 Features

### 🏠 Home Page
- Introducción al proyecto SDOptimizer.
- Accesos rápidos al módulo de modelos.
- Mensajería alineada con DRL + Greedy Algorithm.

### 📦 Model Management
Flujo implementado desde la interfaz web:
1. **Upload Vensim Models**: subida de archivos `.mdl`.
2. **Validation Pipeline**: validación en backend y mensajes de error por estado HTTP.
3. **Model Library**: listado, detalle y eliminación de modelos.
4. **Duplicate Handling**: decisión de reemplazar o conservar ambos archivos.

Actualmente no incluye módulo activo de comparación en rutas de frontend.

### 🎨 Modern UI/UX
- Dark theme optimized for extended use
- Smooth animations and transitions
- Responsive design for various screen sizes
- Custom styled scrollbars
- Toast notifications for user feedback
- Modal dialogs for configuration

## 🏗️ Project Structure

```
src/
├── components/
│   ├── features/          # Feature-specific components
│   │   └── models/        # Model management UI
│   └── ui/                # Reusable UI components
├── pages/                 # Page components
│   ├── home/
│   ├── models/
│   ├── simulation/
├── services/              # API client
│   └── api/
│       ├── models/        # Model endpoints
│       └── ...
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── layout/                # Layout components
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- SDOptimizer Backend API running

### Installing Node.js

Node.js is a JavaScript runtime needed to run this web application.

#### Step 1: Download and Install Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version for your operating system
   - The installer includes npm (Node Package Manager) automatically
3. Run the installer and follow the installation wizard
   - Accept default settings
   - Grant administrator permissions if requested

#### Step 2: Verify Installation

Open a terminal/command prompt and run:

```bash
node --version
```

You should see a version number like `v18.x.x` or higher.

Also verify npm is installed:
```bash
npm --version
```

You should see a version number like `9.x.x` or higher.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/natandreli/SDOptimizer-frontend.git
   cd SDOptimizer-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   
   Edit `src/config/index.ts` to point to your backend:
   ```typescript
   export const API_URL = 'http://localhost:8000'
   ```

### Running the Application

**Development mode with hot reload:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

The application will be available at `http://localhost:5173` (or the next available port)

## 🧪 Development

### Code Quality

**Type checking:**
```bash
npm run type-check
```

**Linting:**
```bash
npm run lint
```

**Auto-fix linting issues:**
```bash
npm run lint:fix
```

**Format code:**
```bash
npm run format
```

**Run all validations:**
```bash
npm run validate
```

## 🎨 Styling

The project uses:
- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS** - Global styles and animations in `globals.css`
- **Framer Motion** - Smooth animations
- **Custom scrollbar** - Themed scrollbars matching dark mode

## 📊 Key Components

### Models Upload Form
- Drag & drop de archivos `.mdl`.
- Validación visual de archivo seleccionado.
- Manejo de errores 400/422 con toasts descriptivos.

### Duplicate File Modal
- Modal de conflicto cuando el nombre ya existe.
- Acciones `Keep both` (renombrado automático) y `Replace`.

### Models List & Detail
- Tarjetas de modelos con metadatos básicos.
- Modal de detalle con variables parseadas.
- Eliminación de modelos con confirmación.

## 🛠️ Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Tabler Icons** - Icon library
- **Sonner** - Toast notifications

## 🎯 User Workflows

### Uploading and Managing Models

1. **Navigate to Models** page
2. **Upload** a Vensim `.mdl` model
3. Si el nombre existe, elegir **Keep both** o **Replace**
4. **Review** model details in the list
5. **Delete** model when needed

## 📱 Responsive Design

The application adapts to different screen sizes:
- **Desktop**: Full side-by-side comparison
- **Tablet**: Stacked layout with preserved features
- **Mobile**: Single column, optimized controls

## 🐛 Known Issues

- Large models may require additional processing time on backend


## 🔮 Future Enhancements

- Integración completa del flujo de optimización DRL + Greedy desde frontend
- Panel de resultados y métricas de optimización
- Historial de ejecuciones por modelo

## 📄 License

![License](https://img.shields.io/badge/License-MIT-yellow)

## 👥 Authors

Natalia Andrea García Ríos
natalia.garcia9@udea.edu.co
ngarciarios2001@gmail.com
