import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import VideoCall from "@/pages/video-call";
import { useAuth } from "./lib/context/auth-context";
import { useEffect } from "react";
import NavBar from "@/components/nav-bar";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/signup");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile">
        {(params) => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/profile/edit">
        {(params) => <ProtectedRoute component={Profile} edit={true} />}
      </Route>
      <Route path="/user/:userId">
        {(params) => <ProtectedRoute component={Profile} params={params} />}
      </Route>
      <Route path="/call/:userId?">
        {(params) => <ProtectedRoute component={VideoCall} params={params} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-1">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
