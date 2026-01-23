import Home from './pages/Home';
import Menu from './pages/Menu';
import Drinks from './pages/Drinks';
import FoodDetails from './pages/FoodDetails';
import CustomFood from './pages/CustomFood';
import Order from './pages/Order';
import About from './pages/About';
import Contact from './pages/Contact';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Menu": Menu,
    "Drinks": Drinks,
    "FoodDetails": FoodDetails,
    "CustomFood": CustomFood,
    "Order": Order,
    "About": About,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};