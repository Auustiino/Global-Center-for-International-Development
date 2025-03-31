import { useState } from "react";
import { UserLanguage, LANGUAGE_OPTIONS, PROFICIENCY_OPTIONS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus } from "lucide-react";
import { addUserLanguage, updateUserLanguage, deleteUserLanguage } from "@/lib/api-services";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserLanguageListProps {
  userId: number;
  editable?: boolean;
}

const UserLanguageList = ({ userId, editable = true }: UserLanguageListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [newProficiency, setNewProficiency] = useState("beginner");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user languages
  const { data: languages, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}/languages`],
    enabled: !!userId,
  });

  const handleAddLanguage = async () => {
    if (!newLanguage) {
      toast({
        title: "Error",
        description: "Please select a language",
        variant: "destructive",
      });
      return;
    }

    try {
      await addUserLanguage(userId, newLanguage, newProficiency);
      toast({
        title: "Success",
        description: "Language added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/languages`] });
      setIsAddDialogOpen(false);
      setNewLanguage("");
      setNewProficiency("beginner");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add language",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProficiency = async (languageId: number, proficiency: string) => {
    try {
      await updateUserLanguage(languageId, proficiency);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/languages`] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update proficiency",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLanguage = async (languageId: number) => {
    try {
      await deleteUserLanguage(languageId);
      toast({
        title: "Success",
        description: "Language removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/languages`] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove language",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading languages...</div>;
  }

  // Filter out languages that are already added
  const availableLanguages = LANGUAGE_OPTIONS.filter(
    (option) => !languages?.some((lang: UserLanguage) => lang.language === option.value)
  );

  return (
    <div>
      <div className="space-y-2">
        {languages?.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No languages added yet</div>
        ) : (
          languages?.map((language: UserLanguage) => (
            <div
              key={language.id}
              className="flex items-center justify-between border border-slate-300 rounded-md p-3"
            >
              <div className="flex items-center">
                <span className="font-medium">
                  {LANGUAGE_OPTIONS.find((l) => l.value === language.language)?.label || language.language}
                </span>
                <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded-full">
                  {PROFICIENCY_OPTIONS.find((p) => p.value === language.proficiency)?.label || language.proficiency}
                </span>
              </div>
              {editable && (
                <div className="flex items-center">
                  <Select
                    defaultValue={language.proficiency}
                    onValueChange={(value) => handleUpdateProficiency(language.id, value)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-sm border-none">
                      <SelectValue placeholder="Select proficiency" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLanguage(language.id)}
                    className="ml-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}

        {editable && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="inline-flex items-center text-secondary hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Language
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new language</DialogTitle>
                <DialogDescription>
                  Select a language you're learning and your proficiency level.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select onValueChange={setNewLanguage} value={newLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proficiency</label>
                  <Select onValueChange={setNewProficiency} value={newProficiency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLanguage}>Add Language</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default UserLanguageList;
