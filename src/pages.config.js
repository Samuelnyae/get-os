import Home from './pages/Home';
import Menu from './pages/Menu';
import Drinks from './pages/Drinks';
import FoodDetails from './pages/FoodDetails';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Menu": Menu,
    "Drinks": Drinks,
    "FoodDetails": FoodDetails,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};