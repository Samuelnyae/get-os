import About from './pages/About';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import CustomFood from './pages/CustomFood';
import Drinks from './pages/Drinks';
import FoodDetails from './pages/FoodDetails';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import OrderTracking from './pages/OrderTracking';
import TableDining from './pages/TableDining';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "Contact": Contact,
    "CustomFood": CustomFood,
    "Drinks": Drinks,
    "FoodDetails": FoodDetails,
    "Home": Home,
    "Menu": Menu,
    "Order": Order,
    "OrderTracking": OrderTracking,
    "TableDining": TableDining,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};