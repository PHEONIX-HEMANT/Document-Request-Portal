import React from "react";
import spider from "../../utils/API";
import "./status.css";
import { FaDownload, FaHistory } from "react-icons/fa";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import TimelineModal from "../timeline/TimelineModal";

const cert_mapping = {
  1: "Bonafide",
  2: "Transcript",
  3: "Course De-Registration",
  4: "Course Re-Registration",
};
export default class Status extends React.Component {
  state = {
    certHis: {},
    loading: true,
    certData: [],
    toggled: [],
    modalViewed: -1,
  };

  handleToggle = (id) => {
    let toggled = Object.assign([], this.state.toggled);
    if (toggled.includes(id)) {
      for (let i = 0; i < toggled.length; i++) {
        if (toggled[i] === id) {
          toggled.splice(i, 1);
        }
      }
      this.setState({ toggled });
      // return false;
    } else {
      toggled.push(id);
      this.setState({ toggled });
      // return true;
    }
  };
  setModalViewed = (id) => {
    this.setState({
      modalViewed: id,
    });
  };
  hideModalViewed = () => {
    this.setState({
      modalViewed: -1,
    });
  };

  componentDidMount = async () => {
    try {
      let cid = [];
      let certHis = Object.assign({}, this.state.certHis);
      let res = await spider.get("/api/student");
      let certs = res.data;
      cid = Object.assign([], certs);
      this.setState({ certData: cid });
      console.log(this.state.certData);
      for (const cc of cid) {
        let response = await spider.get("/api/student/certificate_history", {
          params: { id: cc.id },
        });
        certHis[cc.id] = response.data;
      }
      this.setState({
        certHis,
        loading: false,
      });
    } catch (err) {
     
    }
  };
  handleDownload = async (id, type, ext) => {
    const usertoken = JSON.parse(localStorage.getItem("bonafideNITT2020user"));
    const roll = usertoken.user;
    let response = await spider.get("api/student/certificate_download", {
      params: { id },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", roll + "_" + type + "." + ext);
    document.body.appendChild(link);
    link.click();
  };

  render() {
    return (
      <div id="cert-status">
        <div className="page-header row justify-content-center">
          <h1>Your Documents</h1>
        </div>
        {this.state.loading ? (
          <Loader
            className="text-center"
            type="Audio"
            color="rgb(13, 19, 41)"
            height={100}
            width={100}
            timeout={3000} //3 secs
          />
        ) : (
          <>
            <div className="container req-status">
              {this.state.certData.length === 0 ? (
                <>
                  <p className="nor">
                    <strong>No Documents</strong>
                  </p>
                </>
              ) : (
                <table className="table cert-table status-table timeline-ovf">
                  <thead className="thead-dark">
                    <tr>
                      <th scope="col">S.No</th>
                      <th scope="col">Document Type</th>
                      <th scope="col">Current Status</th>
                      <th scope="col">Email Status</th>
                      <th scope="col">Postal Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {this.state.certData.map((data, index) => {
                      return (
                        <>
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              {cert_mapping[data.type] === "Course Re-Registration" || cert_mapping[data.type] === "Course De-Registration"
                              ? <>{cert_mapping[data.type]} ({data.course_code})</>
                              : <>
                                  {cert_mapping[data.type] === "Transcript"
                                  ? <>{cert_mapping[data.type]} ({data.no_copies})</>
                                  : <>{cert_mapping[data.type]}</>
                                  }
                              </>
                              }
                            </td>
                            <td>{data.status}</td>
                            <td>
                              {data.email_status ? data.email_status : "-"}
                            </td>
                            <td>
                              {data.postal_status ? data.postal_status : "-"}
                            </td>
                            <td>
                              <span className="table-icons">
                                <FaDownload
                                  onClick={() => {
                                    this.handleDownload(
                                      data.id,
                                      cert_mapping[data.type],
                                      data.certificate_extension
                                    );
                                  }}
                                  className="table-icons-item"
                                />
                                <FaHistory
                                  className="table-icons-item history"
                                  onClick={() => {
                                    this.setModalViewed(data.id);
                                  }}
                                />
                              </span>
                            </td>
                          </tr>

                          <TimelineModal
                            id={data.id}
                            show={this.state.modalViewed === data.id}
                            hide={this.hideModalViewed}
                            data={this.state.certHis[data.id]}
                            email={data.email_status}
                            postal={data.postal_status}
                          ></TimelineModal>
                        </>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}
