import MyNav from "../components/MyNav/MyNav";
import MyFooter from "../components/MyFooter/MyFooter";

const BaseLayout = ({ children }) => {
  return (
    <>
      <MyNav />
      {children}
      <MyFooter />
    </>
  );
};

export default BaseLayout;
