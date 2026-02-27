import React from 'react';
import { Box, Typography, Grid, Slide, Backdrop } from '@mui/material';
import { East } from '@mui/icons-material';

interface Natureza {
  id: number;
  descricao: string;
}

interface NaturezaOverlayProps {
  open: boolean;
  onClose: () => void;
  naturezas: Natureza[];
  onSelect: (id: number) => void;
}

const NaturezaOverlay: React.FC<NaturezaOverlayProps> = ({ open, onClose, naturezas, onSelect }) => {
  // Use data from API
  const half = Math.ceil(naturezas.length / 2);
  const leftOptions = naturezas.slice(0, half);
  const rightOptions = naturezas.slice(half);

  return (
    <>
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{ 
          zIndex: 1250, 
          bgcolor: 'rgba(0, 0, 0, 0.5)', // Dark opacity
          backdropFilter: 'none' // Removed blur
        }}
      />
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: { xs: '100%', sm: 550 },
            bgcolor: '#4ba64f', 
            color: 'white',
            borderRadius: 0,
            boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
            p: 0,
            zIndex: 1300,
          }}
        >
          <Box sx={{ p: 2.5, pb: 6 }}>
            <Typography 
              sx={{ 
                mb: 1, 
                fontWeight: 400,
                fontSize: '25px',
                color: 'white'
              }}
            >
              Que tipo de nota fiscal deseja criar?
            </Typography>

            <Grid container spacing={0}>
              {/* Column 1 */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {leftOptions.map((n) => (
                      <Box
                        key={n.id}
                        onClick={() => onSelect(n.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          p: '5px',
                          px: 1, // Decreased horizontal padding
                          height: '34px',
                          boxSizing: 'border-box',
                          borderRadius: 0,
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.08) !important',
                          },
                        }}
                      >
                      <East sx={{ fontSize: 18, color: 'white' }} />
                      <Typography sx={{ fontWeight: 400, fontSize: '15px', color: 'white' }}>
                        {n.descricao}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Column 2 */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {rightOptions.map((n) => (
                      <Box
                        key={n.id}
                        onClick={() => onSelect(n.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                          p: '5px',
                          px: 1, // Decreased horizontal padding
                          height: '34px',
                          boxSizing: 'border-box',
                          borderRadius: 0,
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.08) !important',
                          },
                        }}
                      >
                      <East sx={{ fontSize: 18, color: 'white' }} />
                      <Typography sx={{ fontWeight: 400, fontSize: '15px', color: 'white' }}>
                        {n.descricao}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Slide>
    </>
  );
};

export default NaturezaOverlay;
