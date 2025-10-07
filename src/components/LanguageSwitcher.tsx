import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LanguageSwitcherProps {
  onTranslate: (translatedText: string) => void;
  sourceText: string;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
];

export const LanguageSwitcher = ({ onTranslate, sourceText }: LanguageSwitcherProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText || selectedLanguage === "en") {
      toast({
        title: "Info",
        description: "No translation needed",
      });
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: sourceText,
          targetLanguage: LANGUAGES.find(l => l.code === selectedLanguage)?.name
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast({
            title: "Rate Limit",
            description: "Translation service is rate limited. Please try again later.",
            variant: "destructive",
          });
        } else if (error.message.includes('402')) {
          toast({
            title: "Payment Required",
            description: "Please add credits to your workspace to continue.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.translatedText) {
        onTranslate(data.translatedText);
        toast({
          title: "Success",
          description: `Translated to ${LANGUAGES.find(l => l.code === selectedLanguage)?.name}`,
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Error",
        description: "Failed to translate text",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Auto Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleTranslate} 
          disabled={isTranslating}
          className="w-full"
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            'Translate Captions'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
