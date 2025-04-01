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

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isDevMode, enableDevMode } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Check URL for dev mode parameter
  useEffect(() => {
    const url = new URL(window.location.href);
    const devMode = url.searchParams.get('devMode');
    if (devMode === 'true' && !isDevMode) {
      enableDevMode();
    }
  }, [enableDevMode, isDevMode]);

  useEffect(() => {
    if (!isAuthenticated && !isDevMode) {
      setLocation("/signup");
    }
  }, [isAuthenticated, isDevMode, setLocation]);

  if (!isAuthenticated && !isDevMode) {
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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
