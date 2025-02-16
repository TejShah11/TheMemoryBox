import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Head,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
  Img,
} from "@react-email/components";

// Enum for permission levels
export enum PermissionLevel {
  VIEW = "View",
  EDIT = "Edit",
  ADMIN = "Admin",
}

interface AlbumAccessEmailProps {
  senderEmail: string;
  receiverEmail: string;
  permissionGranter: string;
  albumLink: string;
  albumName: string;
  permissionLevel: PermissionLevel;
}

export const AlbumAccessEmail = ({
  senderEmail,
  receiverEmail,
  permissionGranter,
  albumLink,
  albumName,
  permissionLevel,
}: AlbumAccessEmailProps) => {
  // Create a more descriptive preview text that includes permission level
  const previewText = `${permissionGranter} has granted you ${permissionLevel.toLowerCase()} access to the album "${albumName}"`;

  // Map permission levels to color and description
  const permissionDetails = {
    [PermissionLevel.VIEW]: {
      color: "text-blue-500",
      description: "view only",
    },
    [PermissionLevel.EDIT]: {
      color: "text-green-500",
      description: "edit and contribute",
    },
    [PermissionLevel.ADMIN]: {
      color: "text-red-500",
      description: "full administrative",
    },
  };

  const { color, description } = permissionDetails[permissionLevel];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Row>
                <Img
                  src="https://drive.usercontent.google.com/download?id=1PpcWFwUDkVYeAJRXwRwroxTVqT4OU-zu"
                  alt="Logo"
                  height={120}
                  width={120}
                  className="mx-auto"
                />
              </Row>
              <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-bold text-pink-500">
                Access Granted to Album <br />
                {albumName}
              </Heading>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              Hello {receiverEmail},
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              <strong>{permissionGranter}</strong> has granted you{" "}
              <strong className={color}>{permissionLevel} Access</strong>{" "}
              (ability to {description}) to their album{" "}
              <strong>{albumName}</strong>.
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-pink-500 px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={albumLink}
              >
                View the Album
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              or copy and paste this URL into your browser:{" "}
              <a href={albumLink} className="text-pink-500 no-underline">
                {albumLink}
              </a>
            </Text>
            <Text className="text-center text-[12px] leading-[20px] text-zinc-500">
              Sent by {senderEmail}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

AlbumAccessEmail.PreviewProps = {
  senderEmail: "sender@example.com",
  receiverEmail: "receiver@example.com",
  permissionGranter: "John Doe",
  albumLink: "https://example.com/album-link",
  albumName: "Vacation Photos",
  permissionLevel: PermissionLevel.VIEW,
} as AlbumAccessEmailProps;

export default AlbumAccessEmail;
