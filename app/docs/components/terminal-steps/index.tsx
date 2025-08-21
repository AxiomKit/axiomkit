import React from "react";
import { AutomatedTerminal } from "./automated-terminal";
import { Badge } from "../badge";
import { Terminal } from "lucide-react";

const TerminalSteps = () => {
  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Terminal className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold ">Automated Installation</h3>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Auto
        </Badge>
      </div>
      <AutomatedTerminal />
    </div>
  );
};

export default TerminalSteps;
