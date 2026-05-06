/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import Reservations from './pages/Reservations';
import TableDining from './pages/TableDining';
import Inventory from './pages/Inventory';
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
    "Reservations": Reservations,
    "TableDining": TableDining,
    "Inventory": Inventory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};