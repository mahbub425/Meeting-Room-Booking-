import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RoomDetailsPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Meeting Room: {id || "Unknown"}</CardTitle>
          <CardDescription>Details for this meeting room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            You can view the details of this meeting room.
          </p>
          <p className="text-md text-gray-600 dark:text-gray-400">
            To book this room, please log in.
          </p>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomDetailsPage;