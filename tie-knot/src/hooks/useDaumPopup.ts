import { useState } from "react";
import { Address, useDaumPostcodePopup } from "react-daum-postcode";

const DAUM_POSTCODE_URL = process.env.NEXT_PUBLIC_DAUM_POSTCODE_URL;

const useDaumPopup = () => {
  const [address, setAddress] = useState<string>("");
  const open = useDaumPostcodePopup(DAUM_POSTCODE_URL);

  const handleComplete = (data: Address) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setAddress(fullAddress);
  };

  const handleDaumAddressPopup = () => {
    open({ onComplete: handleComplete });
  };

  return { address, handleDaumAddressPopup };
};

export default useDaumPopup;
