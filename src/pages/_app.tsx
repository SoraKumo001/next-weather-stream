import { AppProps } from "next/app";

const App = ({ Component }: AppProps) => {
  return <Component />;
};
App.getInitialProps = () => ({});
export default App;
