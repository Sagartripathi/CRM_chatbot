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

  // Filter campaigns based on search (minimum 1 character, maximum 6 characters)
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (searchValue.length === 0 || searchValue.length > 6) {
      return true; // Show all when no search or search too long
    }
    const campaignName = campaign.campaign_name || campaign.name || "";
    return campaignName.toLowerCase().includes(searchValue.toLowerCase());
  });

  const handleSelect = (campaignId: string) => {
    const campaign = campaigns.find((c) => c.campaign_id === campaignId);
    if (campaign) {
      const campaignName = campaign.campaign_name || campaign.name || "";
      onValueChange(campaignId, campaignName);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Campaign *</Label>
      <div className="space-y-2">
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
            {/* Embedded search input at the top of the dropdown */}
            <div className="px-2 py-2 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns... (1-6 characters max)"
                  value={searchValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= 6) {
                      setSearchValue(newValue);
                    }
                  }}
                  className="pl-10 h-8"
                  maxLength={6}
                />
              </div>
            </div>
            {filteredCampaigns.length === 0 ? (
              <div className="px-2 py-1 text-sm text-gray-500 text-center">
                No data found
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const campaignName =
                  campaign.campaign_name || campaign.name || "";
                const campaignId = campaign.campaign_id || "";

                return (
                  <SelectItem key={campaignId} value={campaignId}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{campaignName}</span>
                      <span className="text-xs text-gray-500">
                        ({campaignId})
                      </span>
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
