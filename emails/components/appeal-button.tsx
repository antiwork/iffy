import { Button, Column, Row } from "@react-email/components";

interface AppealButtonProps {
  appealUrl: string;
}

export const AppealButton = ({ appealUrl, children }: AppealButtonProps & { children: React.ReactNode }) => {
  return (
    <Row>
      <Column align="center">
        <Button
          href={appealUrl}
          style={{
            backgroundColor: "#000000",
            borderRadius: 5,
            color: "#fff",
            border: "1px solid rgb(0,0,0, 0.1)",
            cursor: "pointer",
            padding: "10px 30px",
            display: "inline-block",
          }}
        >
          {children}
        </Button>
      </Column>
    </Row>
  );
};
