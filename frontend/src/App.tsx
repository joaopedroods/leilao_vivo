import { Routes, Route } from 'react-router-dom'

import Home       from './pages/Home'
import Leilao     from './pages/Leilao'
import Carteira   from './pages/Carteira'
import Notificacoes from './pages/Notificacoes'
import Vender     from './pages/Vender'
import Login      from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login"          element={<Login />} />
      <Route path="/"               element={<Home />} />
      <Route path="/leilao/:id"     element={<Leilao />} />
      <Route path="/carteira"       element={<Carteira />} />
      <Route path="/notificacoes"   element={<Notificacoes />} />
      <Route path="/vender"         element={<Vender />} />
    </Routes>
  )
}