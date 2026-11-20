import TopBar from "../components/top-bar/TopBar";

type Props = {
  // Off when rendered inside a page that already has a top bar (Authentication)
  withTopBar?: boolean;
};

const FourOhFour = ({ withTopBar = true }: Props) => {
  const message = (
    <div
      style={{
        left: "50%",
        top: "50%",
        transform: "translateX(-50%) translateY(-50%)",
        position: "absolute",
        textAlign: "center",
      }}
    >
      <h1>Error</h1>
      <p>This page doesn't exist!</p>
      <div
        className="button button-large"
        onClick={() => {
          window.location.href = "/app";
        }}
      >
        Return to site
      </div>
    </div>
  );

  if (!withTopBar) {
    return message;
  }

  return (
    <div className="flex h-dvh flex-col">
      <TopBar limited={true} />
      <main className="relative min-h-0 flex-1">{message}</main>
    </div>
  );
};

export default FourOhFour;
