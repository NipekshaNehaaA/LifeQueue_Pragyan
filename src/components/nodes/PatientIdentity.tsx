import { useState } from "react";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimelineNode from "@/components/TimelineNode";

interface PatientData {
  name: string;
  age: string;
  gender: string;
  conditions: string;
  bloodPressure: string;
  bloodGroup: string;
}

interface Props {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

const PatientIdentity = ({ data, onChange }: Props) => {
  const [bpError, setBpError] = useState("");

  const update = (field: keyof PatientData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const validateBloodPressure = (value: string) => {
    if (!value) {
      setBpError("");
      return;
    }
    
    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(value)) {
      setBpError("Format must be 120/80");
    } else {
      setBpError("");
      update("bloodPressure", value);
    }
  };

  return (
    <TimelineNode index={1} title="Patient Identity" icon={<User className="w-5 h-5 text-primary" />}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Patient Name
          </label>
          <Input
            placeholder="John Doe"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Age
          </label>
          <Input
            type="number"
            placeholder="45"
            value={data.age}
            onChange={(e) => update("age", e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Gender
          </label>
          <Select value={data.gender} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Pre-existing Conditions
          </label>
          <Input
            placeholder="Diabetes, Hypertension..."
            value={data.conditions}
            onChange={(e) => update("conditions", e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary/50"
          />
        </div>
        
        {/* New Row: Blood Pressure and Blood Group */}
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Blood Pressure
          </label>
          <Input
            placeholder="120/80"
            value={data.bloodPressure}
            onChange={(e) => update("bloodPressure", e.target.value)}
            onBlur={(e) => validateBloodPressure(e.target.value)}
            className={`bg-muted/50 border-border/50 focus:border-primary/50 ${
              bpError ? "border-destructive" : ""
            }`}
          />
          {bpError && (
            <p className="text-xs text-destructive mt-1 font-mono">{bpError}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-mono text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Blood Group
          </label>
          <Select value={data.bloodGroup} onValueChange={(v) => update("bloodGroup", v)}>
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </TimelineNode>
  );
};

export default PatientIdentity;
