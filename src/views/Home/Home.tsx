import { Navigate } from "react-router-dom";
import { Btn } from "../../components/Btn/Btn";
import { BtnGoogleLogin } from "../../components/BtnGoogleLogin/BtnGoogleLogin";
import { Accordion } from "../../components/Accordion/Accordion";
import { toast } from "../../components/toast/toast";
import { useAuth } from "../../db/auth/useAuth";

const Home = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="p-5">
      {/* Login Button */}
      <div className="mb-5">
        <BtnGoogleLogin />
      </div>

      {/* Toast Examples */}
      <section className="mb-5">
        <h2 className="mb-4">Toast Examples</h2>
        <div className="d-flex flex-wrap gap-3">
          <Btn color="success" onClick={() => toast.success("Success! ✨")}>
            Success Toast
          </Btn>
          <Btn
            color="danger"
            onClick={() => toast.error("Something went wrong!")}
          >
            Error Toast
          </Btn>
          <Btn
            color="warning"
            onClick={() =>
              toast.error("Upload failed", {
                subtitle: "File exceeds 10 MB limit",
              })
            }
          >
            Error with Subtitle
          </Btn>
          <Btn
            color="info"
            onClick={() => {
              const id = "load-toast";
              toast.loading("Loading...", { id });
              setTimeout(() => toast.dismiss(id), 2000);
            }}
          >
            Loading Toast
          </Btn>
        </div>
      </section>

      {/* Accordion Example */}
      <section className="mb-5">
        <h2 className="mb-4">Accordion</h2>
        <Accordion defaultOpen={false}>
          <Accordion.Header>What is this app?</Accordion.Header>
          <Accordion.Body>
            This is a demo of custom Bootstrap wrapper components built with
            React and TypeScript. It includes a button component with various
            styles, a modal dialog, an accordion menu, and Google authentication
            integration.
          </Accordion.Body>
        </Accordion>
      </section>
    </div>
  );
};

export default Home;
