
import Homepage from '../pages/homepage/Homepage'
import ProductPage from '../pages/productpage/Productpage'
import ProductDetailPage from '../pages/productdetailpage/ProductDetailPage'
import NewsPage from '../pages/newspage/NewsPage'
import NewsDetail from '../pages/newspage/NewsDetail'
import ContactsPage from '../pages/contactspage/ContactsPage'
import StoreAddressPage from '../pages/storeaddresspage/StoreAddressPage'
import AboutPage from '../pages/static/AboutPage'
import CareersPage from '../pages/static/CareersPage'
// Temporary: point to fixed VIPPage implementation until original file is cleaned
import VIPPage from '../pages/static/VIPPage.fixed'
import PaymentPolicy from '../pages/policy/PaymentPolicy'
import WarrantyPolicy from '../pages/policy/WarrantyPolicy'
import ShippingPolicy from '../pages/policy/ShippingPolicy'
import PrivacyPolicy from '../pages/policy/PrivacyPolicy'
import PurchasePolicy from '../pages/policy/PurchasePolicy'
import SearchResults from '../pages/search/SearchResults'
import Checkoutpage from '../pages/checkoutpage/Checkoutpage'
import { LoginPage, RegisterPage } from '../pages/authpage/AuthPage'
import UserPage from '../pages/userpage/UserPage'
import HotProductsPage from '../pages/collections/HotProductsPage'
import SeasonPage from '../pages/collections/SeasonPage'
import SalePage from '../pages/collections/SalePage'
import EditHighlight from '../pages/admin/EditHighlight'
import AdminPage from '../pages/admin/AdminPage'
import withAdmin from '../utils/withAdmin'

const router =[
    {
        path: "/",
        element: Homepage
    },
    {
        path: "/shop/:category",
        element: ProductPage
    },
    {
        path: "/productdetail/:category/:id",
        element: ProductDetailPage
    },
    {
        path: "/news",
        element: NewsPage
    },
    {
        path: "/about",
        element: AboutPage
    },
    {
        path: "/news/:id",
        element: NewsDetail
    },
    {
        path: "/careers",
        element: CareersPage
    },
    {
        path: "/address",
        element: StoreAddressPage
    },
    {
        path: "/vip",
        element: VIPPage
    },
    {
        path: "/contacts",
        element: ContactsPage
    },
    {
        path: "/login",
        element: LoginPage
    },
    {
        path: "/register",
        element: RegisterPage
    },
    {
        path: "/checkout",
        element: Checkoutpage
    },
    {
        path: "/policy/payment",
        element: PaymentPolicy
    },
    {
        path: "/policy/warranty",
        element: WarrantyPolicy
    },
    {
        path: "/policy/shipping",
        element: ShippingPolicy
    },
    {
        path: "/policy/privacy",
        element: PrivacyPolicy
    },
    {
        path: "/policy/purchase",
        element: PurchasePolicy
    },
    {
        path: "/search",
        element: SearchResults
    },
    {
        path: "/user/:feature",
        element: UserPage
    }
    ,
    {
        path: "/collections/hot-products",
        element: HotProductsPage
    }
    ,
    {
        path: "/sale",
        element: SalePage
    }
    ,
    {
        path: "/collections/thu-dong-2025",
        element: SeasonPage
    }
    ,
    {
        path: "/admin/edit-highlight/:id",
        element: withAdmin(EditHighlight)
    }
    ,
    {
        path: "/admin",
        element: withAdmin(AdminPage)
    }
    
]

export { router, }