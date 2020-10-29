import { Button, Grid, withStyles } from '@material-ui/core';
import React, { Component } from 'react';
import { apis, jobApis } from '../utils/apis.util';
import DashboardTable from './DashboardTable';

const styles = theme => ({
    root: {
        marginTop: '10px'
    }
})

class Dashboard extends Component {
    state = {
        jobs: []
    }

    constructor(props) {
        super(props);
        this.getJobs = this.getJobs.bind(this);
        this.createJob = this.createJob.bind(this);
        this.abortJob = this.abortJob.bind(this);
        this.forceStartJob = this.forceStartJob.bind(this);
        this.setJobPriority = this.setJobPriority.bind(this);
    }

    getJobs() {
        const url = apis.server + apis.jobs + jobApis.getJobs;
        fetch(url, {
            method: 'GET'
        })
            .then(async res => {
                if (res.ok && res.status === 200) {
                    const data = await res.json();
                    if (data.status) {
                        this.setState({
                            jobs: data.jobs
                        });
                    }
                }
                else throw new Error(await res.text())
            })
            .catch(error => console.error(error))
    }

    createJob() {
        const url = apis.server + apis.jobs + jobApis.createJob;
        fetch(url, {
            method: 'POST'
        })
            .then(async res => {
                if (res.ok && res.status === 200) {
                    const data = await res.json();
                    if (data.status) {
                        this.getJobs();
                    }
                    else alert(data.error)
                }
                else throw new Error(await res.text())
            })
            .catch(error => console.error(error))
    }

    abortJob(jobName) {
        const url = apis.server + apis.jobs + jobApis.abortJob;
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobName })
        })
            .then(async res => {
                if (res.ok && res.status === 200) {
                    const data = await res.json();
                    if (data.status) {
                        this.getJobs();
                    }
                    else alert(data.error)
                }
                else throw new Error(await res.text())
            })
            .catch(error => console.error(error))

    }

    forceStartJob(jobName) {
        const url = apis.server + apis.jobs + jobApis.forceStartJob;
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobName })
        })
            .then(async res => {
                if (res.ok && res.status === 200) {
                    const data = await res.json();
                    if (data.status) {
                        this.getJobs();
                    }
                    else alert(data.error)
                }
                else throw new Error(await res.text())
            })
            .catch(error => console.error(error))
    }

    setJobPriority(jobName, oldPriority, newPriority) {
        const url = apis.server + apis.jobs + jobApis.setJobPriotiry;
        fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobName, oldPriority, newPriority })
        })
            .then(async res => {
                if (res.ok && res.status === 200) {
                    const data = await res.json();
                    if (data.status) {
                        this.getJobs();
                    }
                    else alert(data.error)
                }
                else throw new Error(await res.text())
            })
            .catch(error => console.error(error))
    }

    componentDidMount() {
        this.getJobs();
    }

    render() {
        const { classes } = this.props;
        return (
            <Grid container spacing={3} className={classes.root}>
                <Grid item xs={12} sm={12}>
                    <Grid container justify="flex-end">
                        <Grid item xs={2}>
                            <Button size="small" color="primary" variant="outlined" onClick={this.createJob}>Create Job</Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <DashboardTable
                        jobs={this.state.jobs}
                        abortJob={this.abortJob}
                        forceStartJob={this.forceStartJob}
                        setJobPriority={this.setJobPriority}
                    />
                </Grid>
            </Grid>
        )
    }
}

export default withStyles(styles)(Dashboard);