import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, ChevronDown } from "lucide-react";

interface Campaign {
  id: string;
  campaign_id?: string;
  campaign_name?: string;
  name?: string;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  value: string;
  onValueChange: (campaignId: string, campaignName: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CampaignSelector({
  campaigns,
  value,
  onValueChange,
  placeholder = "Search campaigns...",
  disabled = false,
}: CampaignSelectorProps) {
  const [searchValue, setSearchValue] = useState("");

  // Find the selected campaign
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.campaign_id === value
  );

  // Filter campaigns based on search
  const filteredCampaigns = campaigns.filter((campaign) => {
    const campaignName = campaign.campaign_name || campaign.name || "";
    return campaignName.toLowerCase().includes(searchValue.toLowerCase());
  });

  const handleSelect = (campaignId: string) => {
    const campaign = campaigns.find(
      (c) => c.campaign_id === campaignId
    );
    if (campaign) {
      const campaignName = campaign.campaign_name || campaign.name || "";
      onValueChange(campaignId, campaignName);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Campaign *</Label>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={value || ""}
          onValueChange={handleSelect}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedCampaign ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {selectedCampaign.campaign_name || selectedCampaign.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({selectedCampaign.campaign_id})
                  </span>
                </div>
              ) : (
                placeholder
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredCampaigns.length === 0 ? (
              <SelectItem value="" disabled>
                No campaigns found
              </SelectItem>
            ) : (
              filteredCampaigns.map((campaign) => {
                const campaignName = campaign.campaign_name || campaign.name || "";
                const campaignId = campaign.campaign_id || "";
                
                return (
                  <SelectItem key={campaignId} value={campaignId}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{campaignName}</span>
                      <span className="text-xs text-gray-500">({campaignId})</span>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
