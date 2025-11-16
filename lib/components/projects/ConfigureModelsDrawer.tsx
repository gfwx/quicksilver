import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function ConfigureModelsDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className="hover:cursor-pointer" variant="outline">
          <Settings /> Configure models
        </Button>
      </DrawerTrigger>
      <DrawerContent className="items-center">
        <DrawerHeader>
          <DrawerTitle>Available Models</DrawerTitle>
          <DrawerDescription>
            A set of available models, as per the Ollama API
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="w-fit" variant="destructive">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
